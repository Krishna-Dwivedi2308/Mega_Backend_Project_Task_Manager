import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
const userRegistrationValiadator = () => {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('email is required')
      .isEmail()
      .withMessage('email is invalid '),
    body('username')
      .trim()
      .notEmpty()
      .withMessage('username is required')
      .isLength({ min: 3 })
      .withMessage('username must be at least 3 char')
      .isLength({ max: 13 })
      .withMessage('username must be at max 13 char'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('password is required')
      .isLength({ min: 3 })
      .withMessage('password must be at least 3 char')
      .isLength({ max: 13 })
      .withMessage('password must be at max 13 char'),
  ];
};

const userLoginValidator = () => {
  return [
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('username')
      .optional()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 chars'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 chars'),
  ];
};

const resendEmailVerificationValidator = () => {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('email is required')
      .isEmail()
      .withMessage('email is invalid '),
    body('password').trim().notEmpty().withMessage('password is required'),
  ];
};
const forgotPasswordRequestValidator = () => {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('email is required')
      .isEmail()
      .withMessage('email is invalid '),
  ];
};

const resetPasswordValidator = () => {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format'),

    body('token')
      .trim()
      .notEmpty()
      .withMessage('Token is required')
      .isLength({ min: 10 })
      .withMessage('Token looks too short'),

    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ];
};
const changeCurrentPasswordValidator = () => {
  return [
    body('oldPassword')
      .trim()
      .notEmpty()
      .withMessage('oldPassword is required')
      .isLength({ min: 6 })
      .withMessage('oldPassword must be at least 6 characters'),

    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('newPassword is required')
      .isLength({ min: 6 })
      .withMessage('newPassword must be at least 6 characters'),
  ];
};

const validateNoteContent = () => {
  return [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Note content is required')
      .isLength({ min: 3 })
      .withMessage('Note content must be at least 3 characters long')
      .isLength({ max: 50 })
      .withMessage('Note content must not exceed 50 characters'),
  ];
};
const validateCreateOrgContent = () => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 3 })
      .withMessage('Name must be at least 3 characters long')
      .isLength({ max: 30 })
      .withMessage('Name must not exceed 30 characters'),
  ];
};

const validateUpdateOrganization = () => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Organization name is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Organization name must be between 3 and 50 characters'),

    body('organizationId').notEmpty().withMessage('OrganizationId is required'),
  ];
};

const validateProjectId = () => {
  return [
    param('projectId').notEmpty().withMessage('Project Id is required'),
    // .custom((value) => {
    //   if (!mongoose.Types.ObjectId.isValid(value.trim())) {
    //     throw new ApiError(400, 'Invalid Project Id format');
    //   }
    //   return true;
    // }),
  ];
};

const validateUpdateProject = () => {
  return [
    body('name')
      .optional()
      .isString()
      .withMessage('Project name must be a string')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters'),

    body('description')
      .optional()
      .isString()
      .withMessage('Project description must be a string')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Project description must be between 5 and 500 characters'),
  ];
};

export {
  userRegistrationValiadator,
  userLoginValidator,
  resendEmailVerificationValidator,
  resetPasswordValidator,
  forgotPasswordRequestValidator,
  changeCurrentPasswordValidator,
  validateNoteContent,
  validateCreateOrgContent,
  validateUpdateOrganization,
  validateProjectId,
  validateUpdateProject,
};
