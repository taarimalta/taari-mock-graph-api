import { GraphQLScalarType, Kind } from 'graphql';

// Cursor scalar: base64-encoded JSON payload (opaque to clients)
function encodeCursor(payload: any) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function decodeCursor(cursor: string) {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    throw new TypeError('Invalid Cursor value');
  }
}

export const CursorScalar = new GraphQLScalarType({
  name: 'Cursor',
  description: 'Opaque base64-encoded cursor token',
  serialize(value: any) {
    // For outgoing values, accept objects or primitive and encode
    return typeof value === 'string' ? value : encodeCursor(value);
  },
  parseValue(value: any) {
    if (typeof value !== 'string') throw new TypeError('Cursor must be a string');
    return decodeCursor(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) throw new TypeError('Cursor must be a string');
    return decodeCursor(ast.value);
  },
});

// DateTime scalar: ISO8601 strings
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO8601-formatted date-time string',
  serialize(value: any) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return new Date(value).toISOString();
    throw new TypeError('DateTime cannot be serialized from this value');
  },
  parseValue(value: any) {
    if (typeof value !== 'string') throw new TypeError('DateTime must be a string');
    const d = new Date(value);
    if (isNaN(d.getTime())) throw new TypeError('DateTime must be a valid ISO8601 string');
    return d;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) throw new TypeError('DateTime must be a string');
    const d = new Date(ast.value);
    if (isNaN(d.getTime())) throw new TypeError('DateTime must be a valid ISO8601 string');
    return d;
  },
});

export default {
  Cursor: CursorScalar,
  DateTime: DateTimeScalar,
};
