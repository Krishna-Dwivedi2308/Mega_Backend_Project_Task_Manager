import { ApiError } from './ApiError.js';

function asyncHandler(requestHandler) {
  return async function (req, res, next) {
    try {
      await requestHandler(req, res, next);
    } catch (err) {
      // If it's one of your custom errors
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          errors: err.errors || [],
        });
      }

      // For unexpected errors
      console.error('Unexpected error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}

export { asyncHandler };

//this is my easier version
// const asyncHandler = (fn) => {
//     return async function (req, res, next) {
//         try {
//             await fn(req, res,next) //wait for function to be resolved
//         } catch (error) {
//             console.log(`error occured: ${error}`)
//             next(error) //pass the error to the next middleware
//         }
//     }

// }
