import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emailverificationMailGenContent, sendMail } from '../utils/mailgen.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullname } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  console.log('existingUser = \n', existingUser);

  if (existingUser) {
    throw new ApiError(409, 'User with this email or username already exists');
  }

  //now we also store the path of the uploaded avatar in the
  const avatarLocalPath = req.file?.path;
  console.log('req.file = \n', req.file);
  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar not uploaded');
  }

  const avatar_url = await uploadonCloudinary(avatarLocalPath);
  console.log(avatar_url);

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
  console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, 'Error creating user');
  }
  //  3. Generate email verification token
  const { hashedToken, unHashedToken, tokenExpiry } =
    createdUser.generateTemporaryToken();
  createdUser.emailverificationToken = hashedToken;
  createdUser.emailverificationExpiry = tokenExpiry;

  //  4. Create verification link (Template literal fix!)
  const verification_link = `${process.env.BASE_URL}/api/v1/auth/verify-email/token=${unHashedToken}/{email}`;
  console.log('Verification link:', verification_link);

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
const verifyUser = asyncHandler(async (req, res) => {
  //get token from url
  const { token, email } = req.params;
  //valiate if token received
  if (!token) {
    throw new ApiError(498, 'token not received - invalid url');
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

const logoutUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});
const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
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

export { registerUser, loginUser, verifyUser };
