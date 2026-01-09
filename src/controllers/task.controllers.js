import mongoose from 'mongoose';
import { Project } from '../models/project.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ProjectMember } from '../models/projectmember.models.js';
import { Organization } from '../models/organization.models.js';
import { TaskStatusEnum, UserRolesEnum } from '../utils/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import jwt from 'jsonwebtoken';
import { addProjectMemberMailGenContent, sendMail } from '../utils/mailgen.js';
import { SubTask } from '../models/subtask.models.js';
import { Task } from '../models/task.models.js';
import { uploadonCloudinary, uploadPDF } from '../utils/cloudinary.js';
import { populate } from 'dotenv';
import { assign } from 'nodemailer/lib/shared/index.js';

const getAllTasksFromProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!projectId) {
    throw new ApiError(400, 'Project Id missing');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Project Id invalid');
  }

  const foundTasks = await Task.find({ project: projectId })
    .populate({ path: 'assignedBy', select: 'fullname email' })
    .populate({ path: 'assignedTo', select: 'fullname email' });
  // .populate({
  //   path: 'assignedTo',
  //   populate: {
  //     path: 'user',
  //     select: 'fullname email'
  //   }
  // })

  if (!foundTasks || foundTasks.length === 0) {
    throw new ApiError(404, 'No tasks found for this project');
  }
  const response = await Promise.all(
    foundTasks.map(async (task) => {
      const foundSubTasks = await SubTask.find({
        task: new mongoose.Types.ObjectId(task._id),
      }).populate('subtaskCreatedBy', 'fullname email');
      return {
        _id: task._id,
        title: task.title,
        description: task.description,
        project: task.project,
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        status: task.status,
        attachments: task.attachments,
        subtasks: foundSubTasks,
      };
    })
  );
  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Tasks fetched successfully'));
});

// get task by id
const getTaskById = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  if (!projectId || !taskId) {
    throw new ApiError(400, 'both proejct id and task id are requied');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id');
  }
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid Task Id');
  }
  const foundTask = await Task.findById(taskId)
    .populate('project', 'name')
    .populate('assignedTo', 'fullname email')
    .populate('assignedBy', 'fullname email');
  if (!foundTask) {
    throw new ApiError(404, 'No tasks found');
  }

  const foundSubTasks = await SubTask.find({
    task: taskId,
  }).populate('subtaskCreatedBy', 'fullname email');
  // if (foundSubTasks.length == 0) {
  //   throw new ApiError(404, 'No subtasks found');
  // }
  let count = 0;
  foundSubTasks.forEach((subtask) => {
    if (subtask.isCompleted == true) {
      count++;
    }
  });

  if (count == foundSubTasks.length) {
    foundTask.status = TaskStatusEnum.DONE;
  }
  if (count == 0) {
    foundTask.status = TaskStatusEnum.TODO;
  }
  if (count > 0 && count < foundSubTasks.length) {
    foundTask.status = TaskStatusEnum.IN_PROGRESS;
  }
  await foundTask.save();
  const response = {
    task: foundTask,
    subtasks: foundSubTasks || [],
  };
  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Tasks fetched Successfully'));
});

// create task
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo } = req.body;
  // console.log(title,description,assignedToEmail);

  if (!projectId || !title || !description || !assignedTo) {
    throw new ApiError(400, 'All fields are required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id');
  }
  const foundProject = await Project.findById(projectId);
  if (!foundProject) {
    throw new ApiError(404, 'Project not found');
  }
  const founduser = await User.findById(assignedTo);
  if (!founduser) {
    throw new ApiError(
      404,
      'No such member found in this project.Please check the email'
    );
  }

  const asssignedTo = await ProjectMember.findOne({
    user: founduser._id,
    project: new mongoose.Types.ObjectId(projectId),
  });

  let uploadedAttachmentsArray = [];
  // console.log(req.files);

  const receivedAttachments = req.files || [];
  // console.log(receivedAttachments);

  if (receivedAttachments && receivedAttachments.length > 0) {
    uploadedAttachmentsArray = await Promise.all(
      receivedAttachments.map(async (file) => {
        let filePath = file?.path;
        let url = await uploadPDF(filePath);
        return {
          url: url,
          mimetype: file?.mimetype,
          size: file?.size,
        };
      })
    );
  }

  const createdTask = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo: asssignedTo.user,
    assignedBy: req.user._id,
    attachments: uploadedAttachmentsArray,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, createdTask, 'Task Created Successfully'));
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  // only admin and project admin can update the task
  // get details from body
  // save the ones which are provided
  // object.save()
  const { projectId, taskId } = req.params;
  const { title, description, assignedTo, status } = req.body;
  if (!title && !description && !assignedTo) {
    throw new ApiError(400, 'At least one field is required for updation');
  }
  if (!projectId || !taskId) {
    throw new ApiError(400, 'Both project id and task id  are required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id');
  }
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid Task Id');
  }
  // getting the task which is to be updated
  const foundTask = await Task.findOne({
    _id: taskId,
    project: projectId,
  });
  if (!foundTask) {
    throw new ApiError(404, 'Task not found');
  }
  // if assigned to is chaged then assigned by will also change
  // if (assignedToEmail) {
  //   // get user details from the email provided
  //   const founduser = await User.findOne({ email: assignedToEmail });
  //   if (!founduser) {
  //     throw new ApiError(404, 'No such member .Please check the email');
  //   }
  //   // this user should be part of the project
  //   const assignedTo = await ProjectMember.findOne({
  //     user: new mongoose.Types.ObjectId(founduser._id),
  //     project: new mongoose.Types.ObjectId(projectId),
  //   });

  //  const founduser = await User.findById(assignedTo);
  // if (!founduser) {
  //   throw new ApiError(
  //     404,
  //     'No such member found .Please check again'
  //   );
  // }

  if (assignedTo) {
    const asssignedToMember = await ProjectMember.findOne({
      user: assignedTo,
      project: new mongoose.Types.ObjectId(projectId),
    });
    if (!asssignedToMember) {
      throw new ApiError(403, 'Requested user may not be part of this project');
    }
    // if user is a member - change the value task schema data
    foundTask.assignedTo = assignedTo;
    foundTask.assignedBy = req.user?._id;
  }
  // now save the data in the db
  if (title) {
    foundTask.title = title;
  }
  if (description) {
    foundTask.description = description;
  }
  if (status) {
    foundTask.status = status;
  }

  await foundTask.save();
  const updatedTask = await Task.findById(foundTask._id)
    .populate('assignedTo', 'fullname email')
    .populate('assignedBy', 'fullname email');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, 'Task updated successfully'));
});

// delete task
const deleteTask = asyncHandler(async (req, res) => {
  // who can delete task?- admin and project admin
  // get project id and task id in the params
  // also match the given task id belongs to the project id provided
  //if all ok - delete tha task

  const { projectId, taskId } = req.params;
  if (!projectId || !taskId) {
    throw new ApiError(400, 'Both project id and task id  are required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id');
  }
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid Task Id');
  }
  const foundTask = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!foundTask) {
    throw new ApiError(404, 'Task not found');
  }

  await SubTask.deleteMany({ task: foundTask._id }); //delete all the related subtasks also-cascading effect
  await foundTask.deleteOne();
  // this can also be done using a pre('deleteOne') hook also in the Task schema
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { title: foundTask.title },
        'Task deleted successfully'
      )
    );
});

// create subtask
const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body;

  if (!title) {
    throw new ApiError(400, 'Title is required');
  }
  if (!projectId || !taskId) {
    throw new ApiError(400, 'Both project id and task id  are required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id');
  }
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid Task Id');
  }
  const createdSubTask = await SubTask.create({
    task: taskId,
    title,
    subtaskCreatedBy: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, createdSubTask, 'Subtask created successfully'));
});

// update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  // can be updated by project admin, admin or the person who created the subtask
  const { projectId, subtaskId } = req.params;
  const { title, isCompleted } = req.body;

  if (!projectId || !subtaskId) {
    throw new ApiError(400, 'Both project id and subtask id  are required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id');
  }
  if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
    throw new ApiError(400, 'Invalid Subtask Id');
  }
  const foundSubTask = await SubTask.findOne({
    _id: new mongoose.Types.ObjectId(subtaskId),
  });
  if (!foundSubTask) {
    throw new ApiError(404, 'Subtask not found');
  }

  if (req.user.role == UserRolesEnum.MEMBER) {
    if (foundSubTask.subtaskCreatedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(
        401,
        'You do not have permission to perform this task'
      );
    }
  }
  if (title) {
    foundSubTask.title = title;
  }
  if (foundSubTask.isCompleted) {
    foundSubTask.isCompleted = false;
  } else {
    foundSubTask.isCompleted = true;
  }
  await foundSubTask.save();
  return res
    .status(200)
    .json(new ApiResponse(200, foundSubTask, 'Subtask updated successfully'));
});

// delete subtask
const deleteSubTask = asyncHandler(async (req, res) => {
  // same permissions as update subtask
  const { projectId, subtaskId } = req.params;

  if (!projectId || !subtaskId) {
    throw new ApiError(400, 'Both project id and subtask id  are required');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project Id');
  }
  if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
    throw new ApiError(400, 'Invalid Subtask Id');
  }
  const foundSubTask = await SubTask.findOne({
    _id: new mongoose.Types.ObjectId(subtaskId),
  });
  if (!foundSubTask) {
    throw new ApiError(404, 'Subtask not found');
  }

  if (req.user.role == UserRolesEnum.MEMBER) {
    if (foundSubTask.subtaskCreatedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(
        401,
        'You do not have permission to perform this task'
      );
    }
  }

  await SubTask.deleteOne({ _id: foundSubTask._id });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { title: foundSubTask.title },
        'Subtask deleted successfully'
      )
    );
});
const getMyTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const tasks = await Task.find({ assignedTo: userId })
    .populate('assignedTo', 'fullname email')
    .populate('assignedBy', 'fullname email')
    .populate('project', 'name');
  return res
    .status(200)
    .json(new ApiResponse(200, tasks, 'Tasks Fetched Successfully'));
});
export {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getAllTasksFromProject,
  getMyTasks,
  updateSubTask,
  updateTask,
};
