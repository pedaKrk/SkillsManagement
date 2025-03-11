import express from 'express'
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
const router = express.Router()


router.get('/', authenticateToken, authorizeRole(['Admin']), getAllUsers)

router.get('/:id', authenticateToken, getUserById)

router.post('/', authenticateToken, authorizeRole(['Admin']), createUser)

router.put('/:id', authenticateToken, updateUser)

router.delete('/:id', authenticateToken, authorizeRole(['Admin']), deleteUser)

router.post('/change-password', changePassword)

export default router