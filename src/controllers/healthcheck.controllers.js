//this is just a controller for server which the server uses to send request and check if it is getting response thereby confirming the code works
import { ApiResponse } from '../utils/ApiResponse.js';
const healthcheck = (req, res) => {
  console.log('came to healthcheck');
  res.status(200).json(new ApiResponse(200, { message: 'server is running' }));
};
export { healthcheck };
