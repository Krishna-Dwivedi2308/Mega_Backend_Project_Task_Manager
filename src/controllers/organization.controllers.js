import { ApiError } from '../utils/ApiError.js';
import { Project } from '../models/project.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ProjectNote } from '../models/note.models.js';
import { Organization } from '../models/organization.models.js';

const createOrganization = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const alreadyExists = await Organization.findOne({
    name: name,
    admin: new mongoose.Types.ObjectId(req.user._id),
  });

  if (alreadyExists) {
    throw new ApiError(400, 'Organization Name already Exists');
  }
  if (!name) {
    throw new ApiError(400, 'Organization Name Missing');
  }
  const createdOrganization = await Organization.create({
    name: name,
    admin: new mongoose.Types.ObjectId(req.user._id),
  });
  if (!createdOrganization) {
    throw new ApiError(400, 'Organization could not be created');
  }

  const response = await createdOrganization.populate('admin', 'fullname');

  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Organization Created'));
});
const deleteOrganization = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  if (!organizationId) {
    throw new ApiError(400, 'Organization Id Required');
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid Organization ID format');
  }
  const foundOrganization = await Organization.findById(organizationId);
  if (!foundOrganization) {
    throw new ApiError(404, 'Organization not found');
  }
  if (req.user._id.toString() !== foundOrganization.admin.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to delete this organization'
    );
  }
  const response = await foundOrganization?.populate('admin', 'fullname');
  await foundOrganization.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Organization Deleted'));
});
const getAllOrganizations = asyncHandler(async (req, res) => {
  const response = await Organization.find({
    admin: new mongoose.Types.ObjectId(req.user._id),
  });
  if (response.length == 0) {
    throw new ApiError(400, 'Could not find any Organizations');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Organizations Fetched Successfully'));
});
const getOrganizationById = asyncHandler(async (req, res) => {
  const orgId = req.params.organizationId;
  if (!orgId) {
    throw new ApiError(400, 'OrganizationId required');
  }
  if (!mongoose.Types.ObjectId.isValid(orgId)) {
    throw new ApiError(400, 'Invalid Organization ID format');
  }
  const foundOrganization = await Organization.findById(orgId).populate(
    'admin',
    'fullname'
  );
  const projects = await Project.find({
    organization: new mongoose.Types.ObjectId(orgId),
  });
  const response = {
    organization: foundOrganization,
    projects,
  };
  if (!foundOrganization) {
    throw new ApiError(404, 'No Organization Found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Organization Fetched Successfully'));
});
const updateOrganization = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const organizationId = req.body.organizationId;
  if (!name) {
    throw new ApiError(400, 'Organization name Missing');
  }
  if (!organizationId) {
    throw new ApiError(400, 'OrganizationId required');
  }
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid Organization ID format');
  }
  const foundOrganization = await Organization.findById(organizationId);
  if (!foundOrganization) {
    throw new ApiError(404, 'No Organization Found');
  }
  if (foundOrganization.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to update this organization name'
    );
  }
  foundOrganization.name = name;
  await foundOrganization.save();
  const response = await foundOrganization.populate('admin', 'fullname');
  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Organization Updated Successfully'));
});
export {
  createOrganization,
  deleteOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
};
