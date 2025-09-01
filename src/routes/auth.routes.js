import { Router } from 'express';
import {
  forgotPasswordRequest,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  verifyEmail,
} from '../controllers/auth.controllers.js';
import {
  userRegistrationValiadator,
  userLoginValidator,
  resendEmailVerificationValidator,
  resetPasswordValidator,
  forgotPasswordRequestValidator,
} from '../validators/index.js';
import { validate } from '../middlewares/validator.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router
  .route('/register')
  .post(
    upload.single('avatar'),
    userRegistrationValiadator(),
    validate,
    registerUser
  );
router.route('/login').post(userLoginValidator(), validate, loginUser);

//secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refreshAccessToken').post(refreshAccessToken);
router.route('/verify-email').get(verifyEmail);
router
  .route('/resend-verification-email')
  .post(resendEmailVerificationValidator(), validate, resendEmailVerification);
router
  .route('/forgotPasswordRequest')
  .post(forgotPasswordRequestValidator(), validate, forgotPasswordRequest);
router
  .route('/reset-password')
  .post(resetPasswordValidator(), validate, resetForgottenPassword);
// router.route('/verify-email/:token/:email').post(verifyUser);
export default router;
