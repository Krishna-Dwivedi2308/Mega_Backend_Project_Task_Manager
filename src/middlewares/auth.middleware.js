import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import mongoose from 'mongoose';
import { ProjectMember } from '../models/projectmember.models.js';
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.header('Authorization')?.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'unauthorized Request');
    }

    // this will convert our jwt to object that we passed
    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const foundUser = await User.findById(decodedToken?._id);

    if (!foundUser) {
      //todo:discuss about frontend
      throw new ApiError(401, 'Invalid Token');
    }
    // also check if the token was issued after the password was changed
    if (foundUser.passwordChangedAT) {
      if (decodedToken.iat * 1000 < foundUser.passwordChangedAT.getTime()) {
        throw new ApiError(
          401,
          'Password changed recently. Please log in again.'
        );
      }
    }
    //this way we have added a property to our request called user that has the user details
    req.user = foundUser;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'unauthorized Request');
  }
});

export const validateProjectPermission = (role = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    if (!projectId) {
      throw new ApiError(402, 'Invalid Project ID');
    }
    // find this user in the list of project members of the given project
    const projectMember = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });
    // now we have found the logged in user in the list of Project Members of the specified project
    // and therefore we also have the role assigned to them.
    // now we can put check if they have permission to perfrom the action in the route/controller by seeing if the role is present in the passed array

    if (!projectMember) {
      throw new ApiError(404, 'You are not a member of this project');
    }
    const assignedRole = projectMember?.role;

    req.user.role = assignedRole; //this has no utility here as such. we have just done this so that we can display it in UI if we want

    if (!role.includes(assignedRole)) {
      throw new ApiError(
        403,
        'You do not have permission to perform this action'
      );
    }
    next();
  });
