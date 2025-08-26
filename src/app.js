import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
  res.send('Welcome to the Home Page!');
});

//router imports
import healthcheckRouter from './routes/healthcheck.routes.js';
app.use('/api/v1/healthcheck', healthcheckRouter);

app.use('/api/v1/user', authRouter);
export default app;
