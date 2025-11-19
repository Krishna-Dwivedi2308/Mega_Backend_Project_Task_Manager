import { validationResult } from 'express-validator'; //given  by express by default
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

//just a wrapper like asyncHandler to extract the data from our express validator and pass it on to error class .

export const validate = asyncHandler((req, res, next) => {
  const errors = validationResult(req); //errors extracted in array form because remember that array was returned from express validator

  //if no errors
  if (errors.isEmpty()) {
    return next();
  }

  const extractedError = [];
  errors.array().map(
    (err) =>
      extractedError.push({
        [err.path]: err.msg,
      }) //error will have both path and message , so map it in proper key-value format in our new array. Just for clean approach , o/w it was already in an array .
  );
  console.log(extractedError);

  throw new ApiError(422, 'Received data is not valid', extractedError); //data passed into our custom error class
});
