import express from 'express'
import userRoutes from './userRoutes'
import skillRoutes from './skillRoutes'
import commentRoutes from './commentRoutes'

const router = express.Router()

router.use('/users', userRoutes)
router.use('/skills', skillRoutes)
router.use('/comments', commentRoutes)

export default router