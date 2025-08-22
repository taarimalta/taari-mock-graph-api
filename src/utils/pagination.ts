// src/utils/pagination.ts
// Utility functions for cursor encoding/decoding and pagination metadata
import { Buffer } from 'buffer';
import logger from '../logger';

export interface CursorData {
// Support compound sorting: store all order fields and values
orderFields: string[];
orderValues: any[];
id: number;
direction: 'ASC' | 'DESC';
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function isValidCursor(cursor: string): boolean {
  return decodeCursor(cursor) !== null;
}

export function getPaginationMetadata({
  items,
  first,
  last,
  hasNext,
  hasPrevious,
  orderField,
  direction,
}: {
  items: any[];
  first?: number;
  last?: number;
  hasNext: boolean;
  hasPrevious: boolean;
  orderField: string | string[];
  direction: 'ASC' | 'DESC';
}) {
  const startItem = items[0];
  const endItem = items[items.length - 1];
  // Compound cursor: encode all order fields and values
  return {
    hasNext,
    hasPrevious,
    startCursor: startItem
      ? encodeCursor({
          id: startItem.id,
          orderFields: Array.isArray(orderField) ? orderField : [orderField],
          orderValues: Array.isArray(orderField)
            ? orderField.map((f: string) => startItem[f])
            : [startItem[orderField]],
          direction,
        })
      : null,
    endCursor: endItem
      ? encodeCursor({
          id: endItem.id,
          orderFields: Array.isArray(orderField) ? orderField : [orderField],
          orderValues: Array.isArray(orderField)
            ? orderField.map((f: string) => endItem[f])
            : [endItem[orderField]],
          direction,
        })
      : null,
  };
}


/**
 * Builds a Prisma-compatible where clause for compound cursor pagination.
 * Supports any number of order fields, and uses id as tiebreaker.
 *
 * Example: For orderFields = ['name', 'id'], orderValues = ['Alice', 10], id = 10, cmp = 'gt'
 * Returns:
 * {
 *   OR: [
 *     { name: { gt: 'Alice' } },
 *     { AND: [ { name: 'Alice' }, { id: { gt: 10 } } ] }
 *   ]
 * }
 */
export function buildCursorWhereConditions(orderFields: string[], orderValues: any[], id: number, cmp: 'gt' | 'lt') {
  // Only support two fields: primary + id
  if (orderFields.length !== 2) return {};
  const [primaryField, idField] = orderFields;
  const [primaryValue, idValue] = orderValues;
  // If primaryValue is null/undefined, skip that part of the condition
  const primaryCond = (cmp === 'gt') ? { gt: primaryValue } : { lt: primaryValue };
  const idCond = (cmp === 'gt') ? { gt: idValue } : { lt: idValue };
  const orConditions = [];
  if (primaryValue !== null && primaryValue !== undefined) {
    orConditions.push({ [primaryField]: primaryCond });
    orConditions.push({ AND: [ { [primaryField]: primaryValue }, { [idField]: idCond } ] });
  } else {
    // Only use id as tiebreaker if primaryValue is null/undefined
    orConditions.push({ [idField]: idCond });
  }
  return { OR: orConditions };
}

export async function paginate({
model,
where,
orderBy,
first,
after,
last,
before,
include,
orderFields,
}: {
  model: any;
  where: any;
  orderBy: any[];
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  include?: any;
  orderFields?: string[];
}) {
  // Determine pagination direction and cursor
  let cursorData: CursorData | null = null;
  let take = first || last || 20;
  // Support compound orderBy
  // Use explicit orderFields if provided, else infer from orderBy
  let orderFieldsFinal = orderFields && Array.isArray(orderFields) ? orderFields : orderBy.map((ob: any) => Object.keys(ob)[0]);
  let direction = orderBy[0][orderFieldsFinal[0]] === 'asc' ? 'ASC' : 'DESC';
  
  // Enhanced where clause for cursor-based pagination
  let enhancedWhere = where ? { ...where } : {};

  if (after) {
    cursorData = decodeCursor(after);
    if (cursorData && Array.isArray(cursorData.orderFields) && Array.isArray(cursorData.orderValues)) {
      // Instead of using Prisma's cursor + skip, use WHERE conditions for compound sorting
      // This ensures proper positioning in compound-sorted result sets
      const cursorConditions = buildCursorWhereConditions(
        cursorData.orderFields,
        cursorData.orderValues,
        cursorData.id,
        direction === 'ASC' ? 'gt' : 'lt'
      );
      enhancedWhere = where ? { AND: [where, cursorConditions] } : cursorConditions;
    }
  } else if (before) {
    cursorData = decodeCursor(before);
    if (cursorData && Array.isArray(cursorData.orderFields) && Array.isArray(cursorData.orderValues)) {
      // For backward pagination, reverse the comparison direction
      const cursorConditions = buildCursorWhereConditions(
        cursorData.orderFields,
        cursorData.orderValues,
        cursorData.id,
        direction === 'ASC' ? 'lt' : 'gt'
      );
      enhancedWhere = where ? { AND: [where, cursorConditions] } : cursorConditions;
      direction = direction === 'ASC' ? 'DESC' : 'ASC';
    }
  }

  // Debug logging for pagination
  logger.info('=== PAGINATION DEBUG ===');
  logger.info({ cursorData }, 'Cursor Data');
  logger.info({ enhancedWhere }, 'Enhanced Where');
  logger.info({ orderBy }, 'Order By');
  logger.info({ orderFieldsFinal }, 'Order Fields (final)');
  logger.info({ direction }, 'Direction');

  // Fetch items without using Prisma's cursor - use WHERE conditions instead
  const findArgs: any = {
    where: enhancedWhere,
    orderBy,
    take: (last && !first) ? undefined : take + 1,
  };
  if (include) findArgs.include = include;

  let items;
  if (last && !first) {
    // For backward pagination, fetch all, then slice last N
    const allItems = await model.findMany({ where: enhancedWhere, orderBy });
    logger.info({ items: allItems.map((i: any) => ({ id: i.id, name: i.name })) }, 'DEBUG: All items for backward pagination');
    items = allItems.slice(-take - 1);
  } else {
    items = await model.findMany(findArgs);
    logger.info({ items: items.map((i: any) => ({ id: i.id, name: i.name })) }, 'DEBUG: Items for forward pagination');
  }

  let hasNext = false;
  let hasPrevious = false;
  if (last && !first) {
    // Backward pagination
    hasPrevious = items.length > take;
    hasNext = !!before;
    if (hasPrevious) items = items.slice(1);
  } else {
    // Forward pagination
    hasNext = items.length > take;
    hasPrevious = !!after;
    if (hasNext) items.pop();
  }

  // Get totalCount
  const totalCount = await model.count({ where });

  return {
    items: Array.isArray(items) ? items : [],
    pagination: {
      ...getPaginationMetadata({
        items: Array.isArray(items) ? items : [],
        first,
        last,
        hasNext,
        hasPrevious,
        orderField: orderFieldsFinal,
        direction: direction as 'ASC' | 'DESC',
      }),
      totalCount,
    },
  };
}
