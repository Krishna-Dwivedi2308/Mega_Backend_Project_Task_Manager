import { Router } from 'express';
import { validate } from '../middlewares/validator.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getAllTasksFromProject,
  getMyTasks,
  getTaskById,
  updateSubTask,
  updateTask,
} from '../controllers/task.controllers.js';
import { UserRolesEnum } from '../utils/constants.js';

const router = Router();
router
  .route('/createTask/:projectId')
  .post(
    verifyJWT,
    upload.array('files', 5),
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    createTask
  ); //
router
  .route('/getAllProjectTasks/:projectId')
  .get(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    getAllTasksFromProject
  ); //
router.route('/getMyTasks').get(verifyJWT, getMyTasks);
router.route('/getMyTasks').get(verifyJWT, getMyTasks);
router
  .route('/getTaskbyId/:projectId/:taskId')
  .get(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    getTaskById
  );
router
  .route('/createSubTask/:projectId/:taskId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    createSubTask
  );
router
  .route('/deleteTask/:projectId/:taskId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    deleteTask
  );
router
  .route('/updateSubTask/:projectId/:subtaskId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    updateSubTask
  );
router
  .route('/deleteSubTask/:projectId/:subtaskId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    deleteSubTask
  );
router
  .route('/updateTask/:projectId/:taskId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    updateTask
  );

export default router;
