import express from 'express'
import cors from 'cors'

import userRoutes from './routes/user.routes.js'
import skillRoutes from './routes/skill.routes.js'
import commentRoutes from './routes/comment.routes.js'
import authRoutes from "./routes/auth.routes.js";

import connectToDB from "./database/mongodb.js";
import {connectToSMTP} from "./services/email.service.js";

import { PORT } from "./config/env.js";

const app = express()

//  CORS for all Routs
app.use(cors());

app.use(express.json())

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/skills', skillRoutes)
app.use('/api/v1/comments', commentRoutes)
app.use('/api/v1/auth', authRoutes)

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDB()
  await connectToSMTP()
})

export default app