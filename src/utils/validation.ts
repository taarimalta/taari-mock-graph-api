export function isValidEmail(email: string): boolean {
  // Simple RFC 5322-ish regex for basic validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveInt(value: any): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export function assertPositiveInt(value: any, name = 'value') {
  if (!isPositiveInt(value)) {
    const err: any = new Error(`${name} must be a positive integer`);
    err.extensions = { code: 'BAD_USER_INPUT' };
    throw err;
  }
}

export function assertArrayOfPositiveInts(arr: any, name = 'array') {
  if (!Array.isArray(arr)) {
    const err: any = new Error(`${name} must be an array`);
    err.extensions = { code: 'BAD_USER_INPUT' };
    throw err;
  }
  for (const item of arr) {
    if (!isPositiveInt(item)) {
      const err: any = new Error(`${name} must contain only positive integers`);
      err.extensions = { code: 'BAD_USER_INPUT' };
      throw err;
    }
  }
}
