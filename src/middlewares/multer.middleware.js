import multer from 'multer';

// here we are keeping it on our server first
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1000 * 1000, //5MB limit
  },
});
