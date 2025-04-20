import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import userRoutes from './routes/user.routes.js'
import skillRoutes from './routes/skill.routes.js'
import commentRoutes from './routes/comment.routes.js'
import authRoutes from "./routes/auth.routes.js";
import emailRoutes from "./routes/email.routes.js";
import futureSkillsRoutes from "./routes/future-skills.routes.js";

import connectToDB from "./database/mongodb.js";
import {connectToSMTP} from "./services/email.service.js";

import { PORT } from "./config/env.js";

import './models/user.model.js';
import './models/comment.model.js';
import './models/skill.model.js';
import './models/future-skill.model.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

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

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDB()
  await connectToSMTP()
})

export default app