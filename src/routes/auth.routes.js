import { Router } from 'express';
import { registerUser } from '../controllers/auth.controllers.js';
import { userRegistrationValiadator } from '../validators/index.js';
import { validate } from '../middlewares/validator.middleware.js';

const router = Router();
router
  .route('/register')
  .post(userRegistrationValiadator(), validate, registerUser);
export default router;
