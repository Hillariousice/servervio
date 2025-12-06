import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    role: String!
  }

  type Job {
    id: ID!
    title: String!
    description: String!
    budget: Float!
    requester: User!
    status: String!
    applications: [Application!]
  }

  type Application {
    id: ID!
    job: Job!
    provider: User!
    status: String!
  }

  type Query {
    jobs: [Job!]
    job(id: ID!): Job
    me: User
  }

  type Mutation {
    createUser(email: String!, name: String, role: String!): User
    createJob(title: String!, description: String!, budget: Float!): Job
    applyToJob(jobId: ID!): Application
  }
`;
