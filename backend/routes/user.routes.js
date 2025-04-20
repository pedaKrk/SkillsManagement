import express from 'express'
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    uploadProfileImage,
    removeProfileImage
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { handleProfileImageUpload } from '../middleware/upload.middleware.js'
import {getAllLecturers} from "../controllers/user.controller.js";
const router = express.Router()

router.get('/', authenticateToken, getAllUsers)

router.get('/', authenticateToken, getAllLecturers);

router.get('/me', authenticateToken, (req, res) => {
    
    req.params.id = req.user.id || req.user._id;
    getUserById(req, res);
})

router.get('/:id', authenticateToken, getUserById)

router.post('/', authenticateToken, authorizeRole(['Admin']), createUser)

router.put('/:id', authenticateToken, updateUser)

router.delete('/:id', authenticateToken, authorizeRole(['Admin']), deleteUser)

router.post('/change-password', changePassword)

router.post('/:id/profile-image', authenticateToken, handleProfileImageUpload, uploadProfileImage)

router.delete('/:id/profile-image', authenticateToken, removeProfileImage)

export default router