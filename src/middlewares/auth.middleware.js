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
    // cookie options (consistent name)
    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    // If the error is not token expiry, throw immediately
    if (error.name !== 'TokenExpiredError') {
      throw new ApiError(401, error.message || 'Unauthorized request.');
    }

    // Access token expired => use refresh token as backup (harmless fallback)
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
      // Per requirement: if access token expired AND no refresh token => throw
      throw new ApiError(
        401,
        'Access token expired and no refresh token provided.'
      );
    }

    // Verify refresh token and ensure it matches stored value
    try {
      const decodedRefresh = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const userId = decodedRefresh?._id;
      if (!userId) throw new ApiError(401, 'Invalid refresh token payload.');

      const foundUser = await User.findById(userId);
      if (!foundUser)
        throw new ApiError(401, 'Invalid refresh token: user not found.');

      // Ensure incoming refresh token matches stored refreshToken (prevents revoked tokens)
      if (foundUser.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, 'Refresh token is expired or revoked.');
      }

      // Everything ok -> issue a new access token (keep same refresh token as requested)
      const newAccessToken = foundUser.generateAccessToken();

      // Set cookies (accessToken refreshed; re-set refreshToken to same value optionally)
      res.cookie('accessToken', newAccessToken, cookieOptions);
      // Re-setting refresh token cookie is optional; doing so keeps the same cookie attributes
      res.cookie('refreshToken', incomingRefreshToken, cookieOptions);

      // Attach user and continue to controller
      req.user = foundUser;
      return next();
    } catch (refreshErr) {
      throw new ApiError(401, refreshErr?.message || 'Invalid refresh token.');
    }
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
