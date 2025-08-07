import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { typeDefs } from './schema/typeDefs';
import { countryResolvers } from './resolvers/country';
import { animalResolvers } from './resolvers/animal';
import { createContext } from './context';

import type { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestContextWillSendResponse, GraphQLRequestContextDidEncounterErrors } from '@apollo/server';

const loggingPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext: GraphQLRequestContext<any>) {
    const start = Date.now();
    console.log(`\n➡️  Incoming GraphQL request: ${requestContext.request.operationName || 'Anonymous'}\nQuery: ${requestContext.request.query?.replace(/\s+/g, ' ').trim()}\nVariables: ${JSON.stringify(requestContext.request.variables)}`);
    return {
      async willSendResponse(context: GraphQLRequestContextWillSendResponse<any>) {
        const duration = Date.now() - start;
        console.log(`⬅️  Response sent (${context.request.operationName || 'Anonymous'}) in ${duration}ms\n`);
      },
      async didEncounterErrors(context: GraphQLRequestContextDidEncounterErrors<any>) {
        console.error('❌ GraphQL Error:', context.errors);
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
    console.log('--- Incoming HTTP request to /graphql ---');
    console.log('Method:', req.method);
    console.log('Path:', req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });

  app.use('/graphql', expressMiddleware(server, { context: async () => createContext() }));

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`🚀  Server ready at http://localhost:${port}/graphql`);
  });
}

startServer();
