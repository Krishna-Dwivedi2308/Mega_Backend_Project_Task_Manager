import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';

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
    console.log('decodedToken=\n', decodedToken);

    const foundUser = await User.findById(decodedToken?._id);
    if (!foundUser) {
      //todo:discuss about frontend
      throw new ApiError(401, 'Invalid Token');
    }
    //this way we have added a property to our request called user that has the user details
    req.user = foundUser;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'unauthorized Request');
  }
});
