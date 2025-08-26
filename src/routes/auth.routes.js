import { Router } from 'express';
import { registerUser, verifyUser } from '../controllers/auth.controllers.js';
import { userRegistrationValiadator } from '../validators/index.js';
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
router.route('/verify-email/:token/:email').post(verifyUser);
export default router;
