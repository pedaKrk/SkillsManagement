import express from 'express'
import userRoutes from './routes/user.routes.js'
import skillRoutes from './routes/skill.routes.js'
import commentRoutes from './routes/comment.routes.js'
import connectToDB from "./database/mongodb.js";
import { PORT } from "./config/env.js";

const app = express()

app.use(express.json())

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/skills', skillRoutes)
app.use('/api/v1/comments', commentRoutes)

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDB()
})

export default app