// src/utils/pagination.ts
// Utility functions for cursor encoding/decoding and pagination metadata
import { Buffer } from 'buffer';

export interface CursorData {
  id: number;
  orderField: string;
  orderValue: any;
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
  orderField: string;
  direction: 'ASC' | 'DESC';
}) {
  const startItem = items[0];
  const endItem = items[items.length - 1];
  return {
    hasNext,
    hasPrevious,
    startCursor: startItem
      ? encodeCursor({
          id: startItem.id,
          orderField,
          orderValue: startItem[orderField],
          direction,
        })
      : null,
    endCursor: endItem
      ? encodeCursor({
          id: endItem.id,
          orderField,
          orderValue: endItem[orderField],
          direction,
        })
      : null,
  };
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function paginate({
  model,
  where,
  orderBy,
  first,
  after,
  last,
  before,
}: {
  model: any;
  where: any;
  orderBy: any[];
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}) {
  // Determine pagination direction and cursor
  let cursorData: CursorData | null = null;
  let cursor = undefined;
  let take = first || last || 20;
  let skip = 0;
  let direction = orderBy[0][Object.keys(orderBy[0])[0]] === 'asc' ? 'ASC' : 'DESC';

  if (after) {
    cursorData = decodeCursor(after);
    if (cursorData) cursor = { id: cursorData.id };
  } else if (before) {
    cursorData = decodeCursor(before);
    if (cursorData) cursor = { id: cursorData.id };
    direction = direction === 'ASC' ? 'DESC' : 'ASC';
  }

  // Fetch items
  let items = await model.findMany({
    where,
    orderBy,
    cursor,
    skip: cursor ? 1 : 0,
    take: take + 1,
  });

  let hasNext = false;
  let hasPrevious = false;
  if (last && !first) {
    // Backward pagination
    items = items.reverse();
    hasPrevious = items.length > take;
    hasNext = !!before;
    if (hasPrevious) items.pop();
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
        orderField: orderBy[0] ? Object.keys(orderBy[0])[0] : 'id',
        direction: direction as 'ASC' | 'DESC',
      }),
      totalCount,
    },
  };
}
