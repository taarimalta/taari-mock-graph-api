import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { typeDefs } from './schema/typeDefs';
import { countryResolvers } from './resolvers/country';
import { animalResolvers } from './resolvers/animal';
import logger from './logger';
import { createContext } from './context';

import type { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestContextWillSendResponse, GraphQLRequestContextDidEncounterErrors } from '@apollo/server';

const loggingPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext: GraphQLRequestContext<any>) {
    const start = Date.now();
    logger.info(`➡️  Incoming GraphQL request: ${requestContext.request.operationName || 'Anonymous'} | Query: ${requestContext.request.query?.replace(/\s+/g, ' ').trim()} | Variables: ${JSON.stringify(requestContext.request.variables)}`);
    return {
      async willSendResponse(context: GraphQLRequestContextWillSendResponse<any>) {
        const duration = Date.now() - start;
        logger.info(`⬅️  Response sent (${context.request.operationName || 'Anonymous'}) in ${duration}ms`);
      },
      async didEncounterErrors(context: GraphQLRequestContextDidEncounterErrors<any>) {
        logger.error({ errors: context.errors }, '❌ GraphQL Error');
      }
    };
  }
};


async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        ...countryResolvers.Query,
        ...animalResolvers.Query,
      },
      Mutation: {
        ...countryResolvers.Mutation,
        ...animalResolvers.Mutation,
      },
    },
    plugins: [loggingPlugin],
  });
  await server.start();


  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // Logging middleware for all /graphql requests
  app.use('/graphql', (req, res, next) => {
    logger.info('--- Incoming HTTP request to /graphql ---');
    logger.info('Method: ' + req.method);
    logger.info('Path: ' + req.originalUrl);
    logger.info('Headers: ' + JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      logger.info('Body: ' + JSON.stringify(req.body, null, 2));
    }
    next();
  });

  app.use('/graphql', expressMiddleware(server, { context: async () => createContext() }));

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`🚀  Server ready at http://localhost:${port}/graphql`);
  });
}

startServer();
