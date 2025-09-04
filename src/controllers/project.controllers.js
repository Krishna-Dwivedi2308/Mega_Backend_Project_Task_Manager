import mongoose from 'mongoose';
import { Project } from '../models/project.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ProjectMember } from '../models/projectmember.models.js';
import { Organization } from '../models/organization.models.js';
import { UserRolesEnum } from '../utils/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import jwt from 'jsonwebtoken';
import { addProjectMemberMailGenContent, sendMail } from '../utils/mailgen.js';
import { ProjectNote } from '../models/note.models.js';

const assignStatus = (role) => {
  if (role == UserRolesEnum.ADMIN) {
    return 3;
  }
  if (role == UserRolesEnum.PROJECT_ADMIN) {
    return 2;
  }
  if (role == UserRolesEnum.MEMBER) {
    return 1;
  }
  throw new ApiError(500, 'Invalid user role');
};

const getProjects = asyncHandler(async (req, res) => {
  // get user id and search in project members for all projects in which user is a member
  // get project ids from there or populate directly
  // fetch all the details of those project ids
  // validation for fetched projects if not found
  // send success response and data{name description organization createdBy(admin) createdAt updatedAt and projectAdmins=>(to be gotten by seperate db call) }
  //
  const foundMembershipInProjects = await ProjectMember.find({
    user: new mongoose.Types.ObjectId(req.user._id),
  })
    .populate(
      'project',
      '_id name description organization createdBy createdAt updatedAt'
    )
    .populate('organization', 'name');

  if (foundMembershipInProjects.length == 0) {
    throw new ApiError(400, 'No project exists currently');
  }
  // console.log(foundMembershipInProjects);

  const response = await Promise.all(
    foundMembershipInProjects.map(async (foundMember) => {
      if (!foundMember.project) {
        return null;
      }
      const projectAdmins = await ProjectMember.find({
        project: foundMember.project._id,
        role: UserRolesEnum.PROJECT_ADMIN,
      }).populate('user', '_id fullname');

      const adminName = await User.findById(foundMember.project.createdBy);
      const admin = {
        _id: foundMember.project.createdBy,
        fullname: adminName.fullname,
      };

      return {
        _id: foundMember.project._id,
        name: foundMember.project.name,
        description: foundMember.project.description,
        organization: foundMember.project.organization.name, // already populated
        admin: admin,
        createdAt: foundMember.project.createdAt,
        updatedAt: foundMember.project.updatedAt,
        projectAdmins: projectAdmins,
      };
    })
  );
  const validResponse = response.filter((response) => response !== null);
  if (validResponse.length == 0) {
    throw new ApiError(501, 'Could not generate response');
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        validResponse,
        'Project details fetched Successfully'
      )
    );
});

const getProjectById = asyncHandler(async (req, res) => {
  // get project by id
  // 1.1validate the permission at middleware if they are admin/project admin/member
  // 1. get project id from params
  // 2. check if id is valid
  // 3. find project by id
  // 4. check if project exists
  // 5. return success response and project details
  const { projectId } = req.params;
  if (!projectId) {
    throw new ApiError(400, 'Project Id required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id - May be corrupt');
  }
  const foundProject = await Project.findById(projectId);
  if (!foundProject) {
    throw new ApiError(404, 'Project not Found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, foundProject, 'Project Fetched Successfully'));
});

const createProject = asyncHandler(async (req, res) => {
  //   only admin can create a project
  // but admin as a role is not added yet bacause there is no project and role is present in project member model - so a role:admin can only be set when there exists a project
  // way to go=> create a project only by the person who has created the organization = admin
  // once the project is created, create one project member by default because the admin is the first member of every project
  // now all middleware validations will work. This admin can send project member invites to people

  // get organization id from frontend
  const { organizationId, name, description } = req.body;
  // check for validity of this id
  if (!organizationId) {
    throw new ApiError(400, 'Organization Id is required');
  }
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization Id - May be corrupt');
  }
  const foundOrganization = await Organization.findById(organizationId);
  if (!foundOrganization) {
    throw new ApiError(404, 'Organization not found');
  }
  if (foundOrganization.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to create a project in this organization'
    );
  }
  // create project
  const createdProject = await Project.create({
    name,
    description,
    organization: new mongoose.Types.ObjectId(organizationId),
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });
  if (!createdProject) {
    throw new ApiError(501, 'Could not create Project');
  }

  const addAdminAsMember = await ProjectMember.create({
    user: new mongoose.Types.ObjectId(req.user._id),
    organization: new mongoose.Types.ObjectId(organizationId),
    project: new mongoose.Types.ObjectId(createdProject._id),
    role: UserRolesEnum.ADMIN,
  });
  if (!addAdminAsMember) {
    throw new ApiError(501, 'Error creating project');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createProject, 'Project Successfully Created'));
});

const updateProject = asyncHandler(async (req, res) => {
  //   let us make this such that Project admins can also update a project
  // now that we have project members , let us validate the admin and project admin at the middleware
  // get the data as we have already validated
  // fetch the project to be updated from project id in params
  // get the new details from req.body
  // initialize the new details in the project model and save it
  // return success response

  const { projectId } = req.params;
  const { name, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(401, 'Invalid Project Id');
  }
  if (!name && !description) {
    throw new ApiError(
      401,
      'Either Name or Description must be provided to update '
    );
  }

  const foundProject = await Project.findById(projectId);
  if (!foundProject) {
    throw new ApiError(400, 'No such Project Found');
  }

  if (name) foundProject.name = name;
  if (description) foundProject.description = description;
  await foundProject.save();
  return res
    .status(200)
    .json(new ApiResponse(200, foundProject, 'Project Updated Successfully'));
});

const deleteProject = asyncHandler(async (req, res) => {
  // get project id from params
  //   find the project member from schema
  // match the project id
  // also get the organization id
  // chec if the user is admin of the organization
  // if all validations done: delete the project
  // return success response

  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(401, 'Invalid Project Id');
  }
  const foundProject = await Project.findById(projectId);
  if (!foundProject) {
    throw new ApiError(400, 'No such Project Found');
  }

  // this step is extra security to make sure that only the admin of the project can delete the project , not that admin of any project can send delete request for any project
  if (foundProject.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this project');
  }
  await foundProject.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, foundProject, 'Project Deleted Successfully'));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  //   validation for permission done at middleware
  const { projectId } = req.params;
  if (!projectId) {
    throw new ApiError(400, 'Project Id is required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id format');
  }
  const projectMembers = await ProjectMember.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate('user', 'fullname');

  if (!projectMembers) {
    throw new ApiError(404, 'No Project Members Found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMembers,
        'Project Members Fetched Successfully'
      )
    );
});

const addMemberRequest = asyncHandler(async (req, res) => {
  // only the admin of the project can send add request
  // data needed-{Project Id,email}, project Id to be sent in params
  // check if project exists
  // check if user is the creator of the project
  // send all prefilled data to desired member in email and send to frontend
  // fetch the addMember api url using the same data
  // destructure data at backend controller and save the details in Project Member model

  const { projectId } = req.params;
  const { email, role } = req.body;
  if (!projectId) {
    throw new ApiError(400, 'Project Id is required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Project Id not valid');
  }

  const foundProject = await Project.findById(projectId);
  if (!foundProject) {
    throw new ApiError(400, 'Project not found');
  }
  // now check if the user email provided is valid and exists
  const userToBeAdded = await User.findOne({ email: email });
  if (!userToBeAdded) {
    throw new ApiError(400, 'Given user not found');
  }

  if (role === UserRolesEnum.ADMIN) {
    if (!(req.user?.role === UserRolesEnum.ADMIN)) {
      throw new ApiError(401, 'You cannot make someone an admin');
    }
  }

  // once user is found , send an email containing a jwt token that has all the data for them to be added as member
  const generateAddMemberRequestToken = jwt.sign(
    {
      user: userToBeAdded._id,
      organization: foundProject.organization,
      project: projectId,
      role: role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  console.log(generateAddMemberRequestToken);

  // jwt token generated , now send this to the user in email
  // Mailing utility
  const verification_link = `${process.env.FRONTEND_BASE_URL}/api/v1/project/addMember?token=${generateAddMemberRequestToken}&email=${email}`;
  const username = userToBeAdded.username;
  const projectName = foundProject.name;
  //  5. Send verification email
  await sendMail({
    email,
    username,
    mailGenContent: addProjectMemberMailGenContent(
      username,
      verification_link,
      projectName
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: email, username: username },
        'Mail Sent Successfully'
      )
    );
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { token, email } = req.query;
  if (!token && !email) {
    throw new ApiError(400, 'Token and email is required');
  }
  let decodedToken;
  try {
    decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Token invalid or expired');
  }

  const addedMemberToProject = await ProjectMember.create({
    user: new mongoose.Types.ObjectId(decodedToken.user),
    organization: new mongoose.Types.ObjectId(decodedToken.organization),
    project: new mongoose.Types.ObjectId(decodedToken.project),
    role: decodedToken.role,
  });

  if (!addedMemberToProject) {
    throw new ApiError(401, 'Could not add member to project');
  }
  await addedMemberToProject.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, addedMemberToProject, 'Member successfully Added')
    );
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;
  if (!projectId || !memberId) {
    throw new ApiError(400, 'Both memberid and project id are requied');
  }
  const foundMember = await ProjectMember.findOne({
    _id: memberId,
    project: projectId,
  });
  if (!foundMember) {
    throw new ApiError(400, 'Member not Found in this project');
  }

  const memberStatus = assignStatus(foundMember?.role);
  const userStatus = assignStatus(req.user?.role);
  if (memberStatus >= userStatus) {
    throw new ApiError(
      401,
      'You cannot delete a member above or equal to your level in hierarchy'
    );
  }

  await ProjectMember.deleteOne({ _id: foundMember?._id });

  return res
    .status(200)
    .json(new ApiResponse(200, foundMember, 'Member Deleted Successfully'));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { memberId, newRole } = req.body;
  if (!memberId || !newRole) {
    throw new ApiError(400, 'Both memberId and new role are required');
  }
  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, 'Invalid id format');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid id format');
  }

  const foundProject = await Project.findById(projectId);
  const foundMember = await ProjectMember.findOne({
    _id: memberId,
  });
  // only admin can make someone an admin
  if (newRole === UserRolesEnum.ADMIN) {
    if (!(req.user?.role === UserRolesEnum.ADMIN)) {
      throw new ApiError(401, 'You must be an admin to make someone an admin');
    }
  }
  // the role of first admin cannot be chaged at all
  if (foundProject?.createdBy.toString() == foundMember?.user.toString()) {
    throw new ApiError(
      401,
      'This member is the creator of this project . Their role cannot be changed '
    );
  }

  // now we can change the role of the member successfully

  await ProjectMember.updateOne(
    {
      _id: memberId,
    },
    {
      role: newRole,
    }
  );
  const response = await ProjectMember.findById(memberId);
  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Member Role Updated Successfully'));
});

export {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
  addMemberRequest,
};
