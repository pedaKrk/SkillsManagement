import express from 'express'
import userRoutes from './user.routes.js'
import skillRoutes from './skill.routes.js'
import commentRoutes from './comment.routes.js'

const router = express.Router()

router.use('/users', userRoutes)
router.use('/skills', skillRoutes)
router.use('/comments', commentRoutes)

export default router