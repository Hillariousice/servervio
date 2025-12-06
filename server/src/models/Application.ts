import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
  },
});

export const Application = mongoose.model('Application', ApplicationSchema);
