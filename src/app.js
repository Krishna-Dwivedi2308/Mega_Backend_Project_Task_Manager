import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';
import orgRouter from './routes/organization.routes.js';
import healthcheckRouter from './routes/healthcheck.routes.js';
import projectRouter from './routes/project.routes.js';
import taskRouter from './routes/task.routes.js';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
  res.send('Welcome to the Home Page!');
});

//router imports

app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/user', authRouter);
app.use('/api/v1/organization', orgRouter);
app.use('/api/v1/project', projectRouter);
app.use('/api/v1/task', taskRouter);
export default app;
