// Extend Express Request type for userId
import type { Request } from 'express';
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import express from 'express';
import cors from 'cors';
import { typeDefs } from './schema/typeDefs';
import { countryResolvers } from './resolvers/country';
import { animalResolvers } from './resolvers/animal';
import { userResolvers } from './resolvers/user';
import { domainResolvers } from './resolvers/domain';
import scalarResolvers from './schema/scalars';
import logger from './logger';
import { createContext } from './context';
import type { Context } from './context';

import type { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestContextWillSendResponse, GraphQLRequestContextDidEncounterErrors } from '@apollo/server';

const loggingPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext: GraphQLRequestContext<Context>) {
    const start = Date.now();
    logger.info(`➡️  Incoming GraphQL request: ${requestContext.request.operationName || 'Anonymous'} | Query: ${requestContext.request.query?.replace(/\s+/g, ' ').trim()} | Variables: ${JSON.stringify(requestContext.request.variables)}`);
    return {
      async willSendResponse(context: GraphQLRequestContextWillSendResponse<Context>) {
        const duration = Date.now() - start;
        logger.info(`⬅️  Response sent (${context.request.operationName || 'Anonymous'}) in ${duration}ms`);
      },
      async didEncounterErrors(context: GraphQLRequestContextDidEncounterErrors<Context>) {
        logger.error({ errors: context.errors }, '❌ GraphQL Error');
      }
    };
  }
};


async function startServer() {
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers: {
      ...scalarResolvers,
      Query: {
        ...countryResolvers.Query,
        ...animalResolvers.Query,
        ...userResolvers.Query,
        ...domainResolvers.Query,
      },
      Mutation: {
        ...countryResolvers.Mutation,
        ...animalResolvers.Mutation,
        ...domainResolvers.Mutation,
      },
      User: userResolvers.User,
      Country: countryResolvers.Country,
      Animal: animalResolvers.Animal,
      Domain: domainResolvers.Domain,
    },
    plugins: [loggingPlugin],
  });
  await server.start();


  const app = express();
  app.use(cors());
  app.use(express.json());

  // Logging middleware for all /graphql requests
  app.use('/graphql', (req: Request, res, next) => {
    logger.info('--- Incoming HTTP request to /graphql ---');
    logger.info('Method: ' + req.method);
    logger.info('Path: ' + req.originalUrl);
    logger.info('Headers: ' + JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      logger.info('Body: ' + JSON.stringify(req.body, null, 2));
    }
    next();
  });

  // Middleware to enforce x-user-id header (GraphQL-friendly errors), except for GET requests to /graphql
  app.use('/graphql', (req, res, next) => {
    // Allow unauthenticated GET requests for playground
    if (req.method === 'GET') {
      req.userId = undefined;
      return next();
    }
    // Allow unauthenticated introspection POST requests
    if (req.method === 'POST') {
      const body = req.body || {};
      const query = body.query || '';
      if (
        typeof query === 'string' &&
        (query.includes('__schema') || query.includes('__type') || query.includes('IntrospectionQuery'))
      ) {
        req.userId = undefined;
        return next();
      }
    }
    const userIdRaw = req.headers['x-user-id'];
    if (!userIdRaw) {
      const err: any = new Error('x-user-id header is required');
      err.statusCode = 401;
      err.extensions = { code: 'UNAUTHENTICATED' };
      return next(err);
    }
    const userId = Number(userIdRaw);
    if (!Number.isInteger(userId) || userId <= 0) {
      const err: any = new Error('x-user-id header must be a valid user ID number');
      err.statusCode = 400;
      err.extensions = { code: 'BAD_USER_INPUT' };
      return next(err);
    }
    req.userId = userId;
    next();
  });

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }: { req: Request }) => {
      // Build the canonical Context (includes prisma and normalized headers)
      const ctx = createContext(req.headers as any);
      // Prefer the middleware-injected userId (validated earlier) when present
      ctx.userId = req.userId as number | undefined;
      return ctx;
    }
  }));

  // Custom error-handling middleware for JSON error responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // If headers already sent, delegate to default Express error handler
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: {
        message: err.message || 'Internal server error',
        code: err.extensions?.code || 'INTERNAL_SERVER_ERROR',
        details: err.extensions || undefined,
      }
    });
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`🚀  Server ready at http://localhost:${port}/graphql`);
  });
}

startServer();
