export const UserRolesEnum = {
  ADMIN: 'admin',
  PROJECT_ADMIN: 'project_admin',
  MEMBER: 'member',
}; //this is an enum that has key-value pairs

export const AvailableUserRoles = Object.values(UserRolesEnum); //this will return an array made from user roles only so that if frontend wants to build a dropdown then thay can use it

export const TaskStatusEnum = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
}; // will give the task status list
export const AvailableTaskStatus = Object.values(TaskStatusEnum);
