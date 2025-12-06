import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './schema'; // Your GraphQL Schema string
import { resolvers } from './resolvers'; // Your JS Logic
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startServer = async () => {
  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      req,
      prisma, // Inject Prisma into every resolver
      userId: req.headers.authorization // Simple auth check
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  });
};

startServer();