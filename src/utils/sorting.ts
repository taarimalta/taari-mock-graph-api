// src/utils/sorting.ts
// Utility functions for mapping GraphQL sorting inputs to Prisma orderBy

export type SortDirection = 'ASC' | 'DESC';

export function mapCountryOrderField(field: string): string {
  switch (field) {
    case 'NAME':
      return 'name';
    case 'POPULATION':
      return 'population';
    case 'AREA':
      return 'area';
    case 'ID':
      return 'id';
    default:
      return 'name';
  }
}

export function mapAnimalOrderField(field: string): string {
  switch (field) {
    case 'NAME':
      return 'name';
    case 'SPECIES':
      return 'species';
    case 'CATEGORY':
      return 'category';
    case 'ID':
      return 'id';
    default:
      return 'name';
  }
}

export function buildOrderBy(field: string, direction: SortDirection): any[] {
  // Always include ID for stable sorting
  return [
    { [field]: direction.toLowerCase() },
    { id: direction.toLowerCase() },
  ];
}
