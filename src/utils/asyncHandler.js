function asyncHandler(requestHandler) {
  return function (req, res, next) {
    Promise.resolve(
      requestHandler(req, res, next).catch(function (err) {
        next(err);
      })
    );
  };
}

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

export { asyncHandler };
