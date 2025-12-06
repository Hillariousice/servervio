import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # 1. ENUMS: Restrict values to specific options
  enum Role {
    REQUESTER
    PROVIDER
  }

  enum JobStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
  }

  # 2. TYPES: The shape of your data objects
  type User {
    id: ID!
    email: String!
    role: Role!
    # Field resolvers will populate these later
    postedJobs: [Job!] 
    acceptedJobs: [Job!]
  }

  type Job {
    id: ID!
    title: String!
    description: String
    price: Float!
    status: JobStatus!
    createdAt: String!
    # Relationships
    requester: User!
    provider: User
  }

  # 3. AUTH PAYLOAD: What we return on login
  type AuthPayload {
    token: String!
    user: User!
  }
type Message {
  id: ID!
  text: String!
  createdAt: String!
  sender: User!
}
  # 4. QUERIES: Fetching Data
  type Query {
    me: User                                # Get current logged-in user
    feed: [Job!]!                           # Get all OPEN jobs (for providers)
    myJobs: [Job!]!                         # Get jobs I posted or accepted
    job(id: ID!): Job   
    getMessages(jobId: ID!): [Message!]!                    # Get details of one specific job
  }

  # 5. MUTATIONS: Changing Data
  type Mutation {
    signup(email: String!, password: String!, role: Role!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # Marketplace Actions
    postJob(title: String!, description: String, price: Float!): Job!
    acceptJob(jobId: ID!): Job!
    completeJob(jobId: ID!): Job!

    sendMessage(jobId: ID!, text: String!): Message!
  }

  # 6. SUBSCRIPTIONS: Real-time Events
  type Subscription {
    # Listen for status changes on a specific job
    jobUpdated: Job! 
    messageSent(jobId: ID!): Message!
  }
`;

