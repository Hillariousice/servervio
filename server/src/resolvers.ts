import { PubSub } from 'graphql-subscriptions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pubsub = new PubSub(); // The event bus for real-time updates
const APP_SECRET = 'super-secret-key-change-this'; // Put in .env file

export const resolvers = {
  // --- QUERY RESOLVERS ---
  Query: {
    me: async (parent: any, args: any, context: any) => {
      if (!context.userId) throw new Error('Not authenticated');
      return context.prisma.user.findUnique({ where: { id: context.userId } });
    },
    
    feed: async (parent: any, args: any, context: any) => {
      // Return all jobs where status is OPEN (Waiting for a provider)
      return context.prisma.job.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' }
      });
    },

    myJobs: async (parent: any, args: any, context: any) => {
      if (!context.userId) throw new Error('Not authenticated');
      
      // Fetch jobs where I am EITHER the requester OR the provider
      return context.prisma.job.findMany({
        where: {
          OR: [
            { requesterId: context.userId },
            { providerId: context.userId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    },

     getMessages: async (_: any, { jobId }:any, context: any) => {
      if (!context.userId) throw new Error("Unauthorized");
      
      // Fetch messages for this job, ordered by time
      return context.prisma.message.findMany({
        where: { jobId },
        orderBy: { createdAt: 'asc' },
        include: { sender: true } // Eager load the sender info
      });
    }
  },

  // --- MUTATION RESOLVERS ---
  Mutation: {
    signup: async (parent: any, args: any, context: any) => {
      const password = await bcrypt.hash(args.password, 10);
      const user = await context.prisma.user.create({
        data: { ...args, password },
      });
      const token = jwt.sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },

    login: async (parent: any, args: any, context: any) => {
      const user = await context.prisma.user.findUnique({ where: { email: args.email } });
      if (!user) throw new Error('No such user found');

      const valid = await bcrypt.compare(args.password, user.password);
      if (!valid) throw new Error('Invalid password');

      const token = jwt.sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },

    postJob: async (parent: any, args: any, context: any) => {
      if (!context.userId) throw new Error('Not authenticated');

      const newJob = await context.prisma.job.create({
        data: {
          title: args.title,
          description: args.description,
          price: args.price,
          requester: { connect: { id: context.userId } }, // Connect relational data
        },
      });

      // Optional: Notify everyone a new job was posted
      // pubsub.publish('JOB_POSTED', { jobPosted: newJob });
      
      return newJob;
    },

    acceptJob: async (parent: any, { jobId }: any, context: any) => {
      if (!context.userId) throw new Error('Not authenticated');

      const updatedJob = await context.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'IN_PROGRESS',
          provider: { connect: { id: context.userId } }
        },
      });

      // REAL-TIME MAGIC: Publish event that this job changed
      pubsub.publish('JOB_UPDATED', { jobUpdated: updatedJob });

      return updatedJob;
    },
    
    completeJob: async (parent: any, { jobId }: any, context: any) => {
       // Ideally add checks here to ensure only the Requester can complete it
       const updatedJob = await context.prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      });
      
      pubsub.publish('JOB_UPDATED', { jobUpdated: updatedJob });
      return updatedJob;
    },

     sendMessage: async (_: any, { jobId, text }: any, context: any) => {
      if (!context.userId) throw new Error("Unauthorized");

      const newMessage = await context.prisma.message.create({
        data: {
          text,
          jobId,
          senderId: context.userId,
        },
        include: { sender: true }
      });

      // 1. Publish event to listeners
      // We use a dynamic channel name: `JOB_CHAT_{jobId}`
      pubsub.publish(`JOB_CHAT_${jobId}`, { messageSent: newMessage });

      return newMessage;
    }
  },

  // --- SUBSCRIPTION RESOLVERS (Real-time) ---
  Subscription: {
    jobUpdated: {
      // Determine who gets to see the update (filtering) can happen here
      subscribe: () => pubsub.asyncIterator(['JOB_UPDATED']),
    },
    messageSent: {
      // 2. Subscribe to the specific channel for that Job ID
      subscribe: (_: any, { jobId }: any) => {
        return pubsub.asyncIterator([`JOB_CHAT_${jobId}`]);
      }
    }
  },

  // --- FIELD RESOLVERS ---
  // These handle the "Relational" data. 
  // When a client asks for a Job, how do we get the "requester" field?
  Job: {
    requester: (parent: any, args: any, context: any) => {
      return context.prisma.user.findUnique({ where: { id: parent.requesterId } });
    },
    provider: (parent: any, args: any, context: any) => {
      if (!parent.providerId) return null;
      return context.prisma.user.findUnique({ where: { id: parent.providerId } });
    }
  },
  
  User: {
     postedJobs: (parent: any, args: any, context: any) => {
        return context.prisma.job.findMany({ where: { requesterId: parent.id }})
     },
     acceptedJobs: (parent: any, args: any, context: any) => {
        return context.prisma.job.findMany({ where: { providerId: parent.id }})
     }
  }
};