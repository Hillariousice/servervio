import { User } from './models/User';
import { Job } from './models/Job';
import { Application } from './models/Application';

export const resolvers = {
  Query: {
    jobs: async () => {
      return Job.find();
    },
    job: async (_, { id }) => {
      return Job.findById(id);
    },
    me: () => null,
  },
  Mutation: {
    createUser: async (_, { email, name, role }) => {
      const user = new User({ email, name, role });
      await user.save();
      return user;
    },
    createJob: async (_, { title, description, budget }, { user }) => {
      // For now, we'll assume a user is passed in the context
      const job = new Job({ title, description, budget, requester: user.id });
      await job.save();
      return job;
    },
    applyToJob: async (_, { jobId }, { user }) => {
      // For now, we'll assume a user is passed in the context
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      const application = new Application({ job: jobId, provider: user.id });
      await application.save();
      return application;
    },
  },
};
