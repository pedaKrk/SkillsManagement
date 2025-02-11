import express from 'express'
import routes from './routes'
import connectToDB from "./database/mongodb.js";

const app = express()
const PORT = 3000

app.use(express.json())
app.use('/api/v1', routes)

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDB()
})

export default app