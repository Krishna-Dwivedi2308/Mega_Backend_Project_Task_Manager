import app from './app.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db/db.js';

dotenv.config({
  path: './.env',
});
const PORT = process.env.PORT || 8080;
connectDB()
  .then(
    app.listen(PORT, () => {
      console.log(`server is running on  http://localhost:${PORT}`); //listen iff db connected
    })
  )
  .catch((err) => {
    console.log('Mongo db connection error ', err);
  });
