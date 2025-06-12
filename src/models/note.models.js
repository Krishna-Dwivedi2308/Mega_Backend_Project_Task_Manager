import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId, //iska matlab hai id lelo
      ref: 'Project', //kiska id lena hai ? => project ka jis name se mongo db me save hua hai
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
