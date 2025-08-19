declare module '@as-integrations/express4' {
  import type { RequestHandler } from 'express';
  import type { ApolloServer } from '@apollo/server';
  export function expressMiddleware(server: ApolloServer<any>, options?: any): RequestHandler;
}
