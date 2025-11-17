import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import morgan from 'morgan'
import { swaggerSpec, swaggerUi } from "./docs/swagger.js"; // SWAGGER


import userRoutes from './routes/user.routes.js'
import skillRoutes from './routes/skill.routes.js'
import commentRoutes from './routes/comment.routes.js'
import authRoutes from "./routes/auth.routes.js";
import emailRoutes from "./routes/email.routes.js";
import futureSkillsRoutes from "./routes/future-skills.routes.js";
import dashboardRoutes from './routes/dashboard.routes.js';

import connectToDB from "./database/mongodb.js";
import {smtpService} from "./services/mail/smtp.service.js";

import { PORT, NODE_ENV } from "./config/env.js";
import logger from "./config/logger.js";

import './models/user.model.js';
import './models/comment.model.js';
import './models/skill.model.js';
import './models/future.skill.model.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

// HTTP Request Logging with Morgan
const morganStream = {
  write: (message) => {
    const statusCode = parseInt(message.split(' ')[message.split(' ').length - 2]);
    if (statusCode >= 400) {
      logger.warn(message.trim());
    } else if (message.includes('POST') || message.includes('PUT') || message.includes('DELETE')) {
      logger.info(message.trim());
    }
  }
};

const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: morganStream,
  skip: (req, res) => {
    return req.method === 'OPTIONS' || (req.method === 'GET' && res.statusCode < 400);
  }
}));

//  CORS for all Routs
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/skills', skillRoutes)
app.use('/api/v1/comments', commentRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/email', emailRoutes)
app.use('/api/v1/future-skills', futureSkillsRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // SWAGGER



app.listen(PORT, async () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  try {
    await connectToDB()
    await smtpService.connect()
    logger.info('Database and SMTP service connected successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
})

export default app