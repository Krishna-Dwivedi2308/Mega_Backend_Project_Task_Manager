import mongoose, { Schema } from 'mongoose';
import { AvailableUserRoles, UserRolesEnum } from '../utils/constants.js';
const projectmemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    role: {
      type: String,
      enum: AvailableUserRoles, //becoz in enum we just want an array of values
      default: UserRolesEnum.MEMBER, //select the role by using the enum we defined and imported just like object - we can give string value directly also(Hard coding) - not good
    },
  },
  { timestamps: true }
);

export const ProjectMember = mongoose.model(
  'ProjectMember',
  projectmemberSchema
);
