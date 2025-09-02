import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    organization: {
      type: Schema.Types.ObjectId, //means get the id
      ref: 'Organization', //says whose id I need - organization
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
