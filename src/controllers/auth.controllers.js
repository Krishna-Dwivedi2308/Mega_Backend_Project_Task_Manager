import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emailverificationMailGenContent, sendMail } from '../utils/mailgen.js';
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
  const verification_link = `${process.env.BASE_URL}/api/v1/auth/verify-email?token=${unHashedToken}&email=${email}`;
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

//controller-2- now verify user
// const verifyUser = asyncHandler(async (req, res) => {
//   //get token from url
//   const { token, email } = req.params;
//   //valiate if token received
//   if (!token) {
//     throw new ApiError(498, 'token not received - invalid url');
//   }
// });

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
    secure: true,
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

//validation

const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});
const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
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

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, verifyEmail };
