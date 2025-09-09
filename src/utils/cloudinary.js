// Require the cloudinary library
// const cloudinary = require('cloudinary').v2;
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Return "https" URLs by setting secure: true

export const uploadonCloudinary = async (imagePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  // Log the configuration
  // console.log(cloudinary.config());
  // Use the uploaded file's name as the asset's public ID and
  // allow overwriting the asset with new versions
  if (!imagePath) return null;
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: 'image',
  };

  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(imagePath, options);
    console.log(result);
    await fs.unlinkSync(imagePath); // remove the file from server when uploaded successfuly on cloudinary
    return result.url;
  } catch (error) {
    await fs.unlinkSync(imagePath); //delete the file on server in case of error
    console.error(error);
    return error;
  }
};

export const uploadPDF = async (filePath) => {
  console.log('came to upload', filePath);
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      use_filename: true,
      unique_filename: false,
      format: 'zip', // Set the format to 'zip'
    });

    // console.log("Upload successful:", result);
    await fs.unlinkSync(filePath); // remove the file from server when uploaded successfuly on cloudinary
    return result.url;
    // The result object contains the secure_url, public_id, etc.
  } catch (error) {
    await fs.unlinkSync(filePath); //delete the file on server in case of error
    console.error(error);
    return error;
  }
};
