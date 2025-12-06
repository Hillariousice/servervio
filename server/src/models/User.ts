import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  role: {
    type: String,
    required: true,
  },
});

export const User = mongoose.model('User', UserSchema);
