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
    activateUser,
    deactivateUser,
    getUserStatus
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { handleProfileImageUpload } from '../middleware/upload.middleware.js'
import {getAllLecturers} from "../controllers/user.controller.js";
const router = express.Router()

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Returns all users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       401:
 *         description: Unauthorized – authentication required
 */

router.get('/inactive', authenticateToken, authorizeRole(['Admin', 'competence_leader']), getInactiveUsers)
router.get('/inactive/count', authenticateToken, authorizeRole(['Admin', 'competence_leader']), getInactiveUsersCount)


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
router.patch('/:id/activate', authenticateToken, authorizeRole(['Admin', 'competence_leader']), activateUser)
router.patch('/:id/deactivate', authenticateToken, authorizeRole(['Admin', 'competence_leader']), deactivateUser)
router.get('/:id/status', authenticateToken, getUserStatus)

export default router

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Returns all users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized – authentication required
 */

/**
 * @openapi
 * /api/v1/users/inactive:
 *   get:
 *     summary: Returns all inactive users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inactive users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/v1/users/inactive/count:
 *   get:
 *     summary: Returns the count of inactive users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of inactive users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Returns the authenticated user's information
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User object for the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Returns a user by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/v1/users/{id}/status:
 *   get:
 *     summary: Returns the status of a user by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status information for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "active"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/v1/users/lecturers:
 *   get:
 *     summary: Returns all lecturers
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of lecturer users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 */
