import express from 'express'
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    uploadProfileImage,
    removeProfileImage,
    getInactiveUsers,
    getInactiveUsersCount,
    activateUser
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { handleProfileImageUpload } from '../middleware/upload.middleware.js'
const router = express.Router()


router.get('/inactive', authenticateToken, authorizeRole(['Admin', 'competence_leader']), getInactiveUsers)
router.get('/inactive/count', authenticateToken, authorizeRole(['Admin', 'competence_leader']), getInactiveUsersCount)


router.get('/', authenticateToken, getAllUsers)
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
router.patch('/:id/activate', authenticateToken, authorizeRole(['Admin', 'competence_leader']), activateUser)

export default router