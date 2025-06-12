import express from 'express';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Welcome to the Home Page!');
});

//router imports
import healthcheckRouter from './routes/healthcheck.routes.js';
app.use('/api/v1/healthcheck', healthcheckRouter);

import authRouter from './routes/auth.routes.js';
app.use('/api/v1/user', authRouter);
export default app;
