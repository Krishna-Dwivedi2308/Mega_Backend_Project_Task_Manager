import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId, //means get the id
      ref: 'Project', //says whose id I need - Project
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const ProjectNote = mongoose.model('ProjectNote', noteSchema);
