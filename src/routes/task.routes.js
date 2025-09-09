import { Router } from 'express';
import { validate } from '../middlewares/validator.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import { createTask } from '../controllers/task.controllers.js';
import { UserRolesEnum } from '../utils/constants.js';

const router = Router();
router
  .route('/createTask/:projectId')
  .post(
    verifyJWT,
    upload.array('files', 10),
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    createTask
  ); //body validators are pending

export default router;
