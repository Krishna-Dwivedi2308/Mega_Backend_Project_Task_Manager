// boilderplate code
import { ApiError } from '../utils/ApiError.js';
import { Project, Project } from '../models/project.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ProjectNote } from '../models/note.models.js';
const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!projectId) {
    throw new ApiError(400, 'Could not find Project Id');
  }

  //   checking of the project id format is correct
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project ID format');
  }
  const foundProject = await Project.findById(projectId);
  if (!foundProject) {
    throw new ApiError(404, 'Could not find the Project');
  }

  //   this populate function is useful to go to some other schema using existing schema as reference
  const notes = await ProjectNote.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate('createdBy', 'avatar username fullname');
  return res
    .status(200)
    .json(new ApiResponse(200, notes, 'Notes fetched successfully'));
});
const getNoteById = asyncHandler(async (req, res) => {
  // get note by id
  const { noteId } = req.params;
  if (!noteId) {
    throw new ApiError(400, 'Note Id required');
  }

  //   checking of the note id format is correct
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new ApiError(400, 'Invalid Note ID format');
  }
  const note = await ProjectNote.findById(noteId).populate(
    'createdBy',
    'avatar username fullname'
  );
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note fetched successfully'));
});

const createNote = asyncHandler(async (req, res) => {
  //   1.get project id and content from body
  // 2. use req.user to get user._id
  // 3. find the relevant project to check if such a project exists
  // 4. create a new note store the data in the new note
  // 5. note.save()
  // 6. return success response
  const { projectId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;
  if (!projectId || !content) {
    throw new ApiError(400, 'Project Id or Note Content Missing');
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid Project ID format');
  }
  const foundProject = await Project.findById(projectId);
  if (!foundProject) {
    throw new ApiError(404, 'Project not found');
  }
  const createdNote = await ProjectNote.create({
    project: new mongoose.Types.ObjectId(projectId),
    createdBy: new mongoose.Types.ObjectId(userId),
    content: content,
  });

  // await createdNote.save() - 'create' saves the values by default
  return res
    .status(200)
    .json(new ApiResponse(200, createdNote, 'Note Created Successfully'));
});
const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content } = req.body;

  if (!noteId || !content) {
    throw new ApiError(400, 'Note Id or Note Content Missing');
  }

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new ApiError(400, 'Invalid Note ID format');
  }

  const foundNote = await ProjectNote.findById(noteId);
  if (!foundNote) {
    throw new ApiError(404, 'Note not found');
  }

  // Authorization check
  if (!foundNote.createdBy.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to update this note');
  }
  foundNote.content = content;
  await foundNote.save();

  return res
    .status(200)
    .json(new ApiResponse(200, foundNote, 'Note Updated Successfully'));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  if (!noteId) {
    throw new ApiError(400, 'Note Id Required');
  }

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new ApiError(400, 'Invalid Note ID format');
  }
  const foundNote = await ProjectNote.findById(noteId);
  if (!foundNote) {
    throw new ApiError(404, 'Note not found');
  }
  // Authorization check
  if (!foundNote.createdBy.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to delete this note');
  }
  await foundNote.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, foundNote, 'Note Deleted Successfully'));
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
