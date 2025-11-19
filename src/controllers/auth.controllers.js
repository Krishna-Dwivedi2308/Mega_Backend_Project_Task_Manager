import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  emailverificationMailGenContent,
  forgotPasswordMailGenContent,
  sendMail,
} from '../utils/mailgen.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();
    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went Wrong while generating access and refresh token '
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullname } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  // console.log('existingUser = \n', existingUser);

  if (existingUser) {
    throw new ApiError(409, 'User with this email or username already exists');
  }

  //now we also store the path of the uploaded avatar in the
  const avatarLocalPath = req.file?.path;
  // console.log('req.file = \n', req.file);
  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar not uploaded');
  }

  const avatar_url = await uploadonCloudinary(avatarLocalPath);
  // console.log(avatar_url);

  if (!avatar_url) {
    throw new ApiError(400, 'avatar not uploaded');
  }

  //  1. Create user object

  //  2. Create user (password will be auto-hashed by pre-save hook)
  const createdUser = await User.create({
    email,
    username,
    password,
    fullname,
    avatar: avatar_url,
  });
  // console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, 'Error creating user');
  }
  //  3. Generate email verification token
  const { hashedToken, unHashedToken, tokenExpiry } =
    createdUser.generateTemporaryToken();
  createdUser.emailverificationToken = hashedToken;
  createdUser.emailverificationExpiry = tokenExpiry;

  //  4. Create verification link (Template literal fix!)
  const verification_link = `${process.env.FRONTEND_BASE_URL}/api/v1/auth/verify-email?token=${unHashedToken}&email=${email}`;
  // console.log('Verification link:', verification_link);

  //  5. Send verification email
  await sendMail({
    email,
    username,
    mailGenContent: emailverificationMailGenContent(
      username,
      verification_link
    ),
  });

  // 6. Save updated user with token info
  await createdUser.save();

  //  7. Respond (omit sensitive info like password, token)
  const userResponse = {
    _id: createdUser._id,
    email: createdUser.email,
    username: createdUser.username,
    fullname: createdUser.fullname,
    isEmailVerified: createdUser.isEmailVerified,
    createdAt: createdUser.createdAt,
    avatar: createdUser.avatar,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        userResponse,
        'User registered successfully. Please verify your email.'
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  // steps in login algo
  // 1. find user by email or username
  // 2. check if user exists
  // 3. check if user role is correct
  // 4. check if email is verified
  // 5. check if password is correct
  // 6. generate access token and refresh token
  // 7. send access token and refresh token in response.cookies
  // 8. send success response with user details

  if (!email && !username) {
    throw new ApiError(400, 'email or username is required');
  }

  const founduser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!founduser) {
    throw new ApiError(401, 'User not found');
  }

  if (!founduser.isEmailVerified) {
    throw new ApiError(401, 'User email is not verified');
  }

  const isPasswordOK = await founduser.isPasswordCorrect(password);
  if (!isPasswordOK) {
    throw new ApiError(401, 'Password incorrect');
  }

  const { accessToken, RefreshToken } = await generateAccessAndRefreshToken(
    founduser._id
  );

  const loggedInUser = await User.findById(founduser._id);
  const userResponse = {
    _id: loggedInUser._id,
    email: loggedInUser.email,
    username: loggedInUser.username,
    fullname: loggedInUser.fullname,
  };

  const options = {
    httpOnly: true,
    secure: true, //for development
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', RefreshToken, options)
    .json(new ApiResponse(200, userResponse, 'user logged in successfully'));
});

const logoutUser = asyncHandler(async (req, res) => {
  //0. get user id from cookies
  //1. remove access token and refresh token from cookies
  //2.remove reresh token from database
  //3. send success response
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } }, //mongoDB does not store 'undefined' so if we set it to 'null' , only then it will work
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'user logged out successfully'));

  //validation
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    throw new ApiError(400, 'Invalid verification link');
  }

  // hash the incoming token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // find user with matching email and token
  const user = await User.findOne({
    email,
    emailverificationToken: hashedToken,
    emailverificationExpiry: { $gt: Date.now() }, // not expired
  });

  if (!user) {
    throw new ApiError(400, 'Token is invalid or expired');
  }

  // mark as verified
  user.isEmailVerified = true;
  user.emailverificationToken = undefined;
  user.emailverificationExpiry = undefined;
  await user.save();

  res.status(200).json(new ApiResponse(200, {}, 'Email verified successfully'));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  //resend the verification email in case the user missed the token expiry duration
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, 'email is required');
  }

  const founduser = await User.findOne({ email });

  if (!founduser) {
    throw new ApiError(401, 'User not found');
  }

  if (founduser.isEmailVerified) {
    throw new ApiError(400, 'User email is already verified');
  }

  const isPasswordOK = await founduser.isPasswordCorrect(password);
  if (!isPasswordOK) {
    throw new ApiError(401, 'Password incorrect');
  }

  // send verification link

  //  3. Generate email verification token
  const { hashedToken, unHashedToken, tokenExpiry } =
    founduser.generateTemporaryToken();
  founduser.emailverificationToken = hashedToken;
  founduser.emailverificationExpiry = tokenExpiry;

  //  4. Create verification link (Template literal fix!)
  const verification_link = `${process.env.FRONTEND_BASE_URL}/api/v1/auth/verify-email?token=${unHashedToken}&email=${email}`;
  // console.log('Verification link:', verification_link);
  const username = founduser.username;
  //  5. Send verification email
  await sendMail({
    email,
    username,
    mailGenContent: emailverificationMailGenContent(
      username,
      verification_link
    ),
  });

  // 6. Save updated user with token info
  await founduser.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { username }, 'email sent successfully'));
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'email is required');
  }

  const founduser = await User.findOne({ email });
  if (!founduser) {
    throw new ApiError(401, 'cannot find user');
  }
  const { hashedToken, unHashedToken, tokenExpiry } =
    founduser.generateTemporaryToken();
  //send unhashed token to email
  // store hashed token to db
  // store token expiry timestamp to db
  // success message - reset email sent
  const verification_link = `${process.env.FRONTEND_BASE_URL}/api/v1/auth/reset-password?token=${unHashedToken}&email=${email}`;
  const username = founduser.username;
  //  5. Send verification email
  await sendMail({
    email,
    username,
    mailGenContent: forgotPasswordMailGenContent(username, verification_link),
  });

  founduser.forgotPasswordToken = hashedToken;
  founduser.forgotPasswordExpiry = tokenExpiry;
  await founduser.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: founduser.email },
        `Email sent to the email address: ${founduser.email}`
      )
    );
});
const resetForgottenPassword = asyncHandler(async (req, res) => {
  // get the token and email form query params
  //check the email in db
  // match the corresponding token after hashing and its expiry
  //  get the new password from user
  // save the data in DB .
  // return success response
  const { token, email, password } = req.body;
  // console.log(token,email,password);

  if (!email || !token || !password) {
    throw new ApiError(400, 'email,token and password are required');
  }
  const founduser = await User.findOne({ email });
  if (!founduser) {
    throw new ApiError(401, 'user not found');
  }
  // hash the incoming token and compare with the stored token
  const incomingTokenHashed = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  if (
    founduser.forgotPasswordToken == incomingTokenHashed &&
    founduser.forgotPasswordExpiry > Date.now()
  ) {
    founduser.password = password;
  } else {
    throw new ApiError(401, 'Link invalid or Expired');
  }
  founduser.forgotPasswordExpiry = undefined;
  founduser.forgotPasswordToken = undefined;
  await founduser.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { message: 'Password reset Successful' }, 'Success')
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh Token not received');
  }
  try {
    const decodedRefreshToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const foundUser = await User.findById(decodedRefreshToken?._id);

    if (!foundUser) {
      throw new ApiError(401, 'Invalid Refresh Token ');
    }
    // now that we have received the user and we also have a user based on the token,let us compare first if both of the refresh tokens match

    if (!(incomingRefreshToken == foundUser.refreshToken)) {
      throw new ApiError(401, 'Refresh Token is expired or used');
    }

    //now when both of them match ?=>generate new access and refresh token
    const accessToken = foundUser.generateAccessToken();
    //store this in cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .json(new ApiResponse(200, { accessToken }, 'Access Token Refreshed'));
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid Refresh Token');
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'oldPassword and newPassword are required');
  }
  const founduser = req.user;
  const isPasswordCorrect = await founduser.isPasswordCorrect(oldPassword);
  // a;though this will never run because the middleware passed the user , if not been found it would have thrown error .
  if (!founduser) {
    throw new ApiError(
      401,
      'Login session invalid or expired. Kindly Login again'
    );
  }
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Existing Password does not match');
  }
  founduser.password = newPassword;
  founduser.refreshToken = null;
  const response = {
    email: founduser.email,
    username: founduser.username,
  };
  await founduser.save();

  const options = {
    httpOnly: true,
    secure: true,
  };
  // also remove the cookies from user device so that they can not use the old token
  res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(
      new ApiResponse(
        200,
        response,
        'Password Changed Successfully. PLease login again '
      )
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  const response = {
    avatar: user.avatar,
    email: user.email,
    username: user.username,
    fullname: user.fullname,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return res.status(200).json(new ApiResponse(200, response, 'Success'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
  resendEmailVerification,
  forgotPasswordRequest,
  resetForgottenPassword,
  changeCurrentPassword,
  getCurrentUser,
};
