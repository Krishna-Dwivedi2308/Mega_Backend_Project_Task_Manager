import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  verifyEmail,
} from '../controllers/auth.controllers.js';
import {
  userRegistrationValiadator,
  userLoginValidator,
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
// router.route('/verify-email/:token/:email').post(verifyUser);
export default router;
