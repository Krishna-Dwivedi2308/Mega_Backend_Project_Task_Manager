import { body } from 'express-validator';
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
    body('username').trim().notEmpty().withMessage('username is required'),
  ];
};

const userLoginValidator = () => {
  return [
    body('email').isEmail().withMessage('invalid email'),
    body('password').notEmpty().withMessage('password cannot be empty'),
  ];
};

export { userRegistrationValiadator, userLoginValidator };
