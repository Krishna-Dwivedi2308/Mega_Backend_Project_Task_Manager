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

export { userRegistrationValiadator, userLoginValidator };
