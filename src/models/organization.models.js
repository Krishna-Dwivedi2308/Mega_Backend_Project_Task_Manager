import mongoose, { Schema } from 'mongoose';

const organizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model('Organization', organizationSchema);
