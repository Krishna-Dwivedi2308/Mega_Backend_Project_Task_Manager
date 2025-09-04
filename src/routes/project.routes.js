import { Router } from 'express';
import {
  addMemberRequest,
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
} from '../controllers/project.controllers.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import { UserRolesEnum } from '../utils/constants.js';
import { validate } from '../middlewares/validator.middleware.js';
import {
  validateProjectId,
  validateUpdateProject,
} from '../validators/index.js';
const router = Router();
router.route('/getAllProjects').get(verifyJWT, getProjects);
router
  .route('/getProjectById/:projectId')
  .get(
    verifyJWT,
    validateProjectId(),
    validate,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    getProjectById
  );
router.route('/createProject').post(verifyJWT, createProject);
router
  .route('/updateProject/:projectId')
  .post(
    verifyJWT,
    validateUpdateProject(),
    validate,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    updateProject
  );
router
  .route('/deleteProject/:projectId')
  .get(
    verifyJWT,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteProject
  );

router
  .route('/getAllProjectMembers/:projectId')
  .get(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    getProjectMembers
  );
router
  .route('/addMemberRequest/:projectId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    addMemberRequest
  );
router.route('/addMember').get(verifyJWT, addMemberToProject);
router
  .route('/deleteMember/:projectId/:memberId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    deleteMember
  );
router
  .route('/updateMemberRole/:projectId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    updateMemberRole
  );
export default router;
