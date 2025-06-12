import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emailverificationMailGenContent, sendMail } from '../utils/mailgen.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullname } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(400, 'User with this email or username already exists');
  }

  //  2. Create user (password will be auto-hashed by pre-save hook)
  const createdUser = await User.create({
    email,
    username,
    password,
    fullname,
  });

  //  3. Generate email verification token
  const { hashedToken, unHashedToken, tokenExpiry } =
    createdUser.generateTemporaryToken();
  createdUser.emailverificationToken = hashedToken;
  createdUser.emailverificationExpiry = tokenExpiry;

  //  4. Create verification link (Template literal fix!)
  const verification_link = `${process.env.BASE_URL}/api/v1/auth/verify-email?token=${unHashedToken}&email=${email}`;
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
const loginUser = asyncHandler(async (req, res) => {});
export { registerUser, loginUser };
