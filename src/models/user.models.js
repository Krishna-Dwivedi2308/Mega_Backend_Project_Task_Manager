import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { type } from 'os';
const userSchema = new Schema(
  {
    avatar: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    passwordChangedAT: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    emailverificationToken: {
      type: String,
    },
    emailverificationExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

//password hashing - can be done in controllers also but in models is good
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    //note how this is written
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordChangedAT = Date.now();
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString('hex');
  //there is no need to hash but just for practice we will hash it and store in db
  const hashedToken = crypto
    .createHash('sha256')
    .update(unHashedToken)
    .digest('hex');
  const tokenExpiry = Date.now() + 20 * 60 * 1000; //20 min
  return { hashedToken, unHashedToken, tokenExpiry };
};

export const User = mongoose.model('User', userSchema);
