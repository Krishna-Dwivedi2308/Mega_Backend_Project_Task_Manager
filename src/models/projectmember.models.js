import mongoose, { Schema } from 'mongoose';
import { AvailableUserRoles, UserRolesEnum } from '../utils/constants.js';
const projectmemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    organization: {
      type: Schema.Types.ObjectId, //means get the id
      ref: 'Organization', //says whose id I need - organization
      required: true,
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
    isApproved: {
      type: Boolean,
      default: false,
    },
    addMemberRequestToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export const ProjectMember = mongoose.model(
  'ProjectMember',
  projectmemberSchema
);
