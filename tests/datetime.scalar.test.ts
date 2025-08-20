import { DateTimeScalar } from '../src/schema/scalars';
import { Kind } from 'graphql';

describe('DateTime scalar', () => {
  it('serializes Date to ISO string', () => {
    const d = new Date('2020-01-01T00:00:00Z');
    expect(DateTimeScalar.serialize(d)).toBe('2020-01-01T00:00:00.000Z');
  });

  it('parses valid ISO string', () => {
    const v = DateTimeScalar.parseValue('2020-01-01T00:00:00Z');
    expect(v instanceof Date).toBe(true);
    expect((v as Date).toISOString()).toBe('2020-01-01T00:00:00.000Z');
  });

  it('throws on invalid parseValue', () => {
    expect(() => DateTimeScalar.parseValue('not-a-date')).toThrow();
  });

  it('parses literal', () => {
    const ast: any = { kind: Kind.STRING, value: '2020-01-02T03:04:05Z' };
    const v = DateTimeScalar.parseLiteral(ast, {} as any);
    expect(v instanceof Date).toBe(true);
    expect((v as Date).toISOString()).toBe('2020-01-02T03:04:05.000Z');
  });

  it('throws on invalid parseLiteral', () => {
    const ast: any = { kind: Kind.STRING, value: 'invalid' };
    expect(() => DateTimeScalar.parseLiteral(ast, {} as any)).toThrow();
  });
});
