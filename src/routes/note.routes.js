import { Router } from 'express';
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from '../controllers/note.controllers.js';
import { UserRolesEnum } from '../utils/constants.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { validateNoteContent } from '../validators/index.js';
const router = Router();

router.route('/getNotes/:projectId').get(verifyJWT, getNotes);
router
  .route('/createNote/:projectId')
  .post(
    verifyJWT,
    validateNoteContent(),
    validate,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    createNote
  );
router
  .route('/getNoteById/:projectId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    getNoteById
  );
router
  .route('/updateNote/:noteId')
  .post(
    verifyJWT,
    validateNoteContent(),
    validate,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    updateNote
  );
router
  .route('/deleteNote/:projectId/:noteId')
  .post(
    verifyJWT,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    deleteNote
  );

export default router;
