import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/auth.controllers.js';
import {
  userRegistrationValiadator,
  userLoginValidator,
} from '../validators/index.js';
import { validate } from '../middlewares/validator.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

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
// router.route('/verify-email/:token/:email').post(verifyUser);
export default router;
