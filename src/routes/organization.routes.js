import { Router } from 'express';

import { UserRolesEnum } from '../utils/constants.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import {
  validateCreateOrgContent,
  validateUpdateOrganization,
} from '../validators/index.js';
import {
  createOrganization,
  deleteOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
} from '../controllers/organization.controllers.js';

const router = Router();

router
  .route('/createOrganization')
  .post(verifyJWT, validateCreateOrgContent(), validate, createOrganization);
router
  .route('/deleteOrganization/:organizationId')
  .post(verifyJWT, deleteOrganization);
router.route('/getAllOrganizations').get(verifyJWT, getAllOrganizations);
router
  .route('/getOrganizationById/:organizationId')
  .get(verifyJWT, getOrganizationById);
router
  .route('/updateOrganization')
  .post(verifyJWT, validateUpdateOrganization(), validate, updateOrganization);
export default router;
