import express from "express";
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
	getUserStatus,
} from "../controllers/user.controller.js";
import {
	authenticateToken,
	authorizeRole,
} from "../middleware/auth.middleware.js";
import { handleProfileImageUpload } from "../middleware/upload.middleware.js";
import { getAllLecturers } from "../controllers/user.controller.js";
const router = express.Router();

router.get(
	"/inactive",
	authenticateToken,
	authorizeRole(["Admin", "competence_leader"]),
	getInactiveUsers
);
router.get(
	"/inactive/count",
	authenticateToken,
	authorizeRole(["Admin", "competence_leader"]),
	getInactiveUsersCount
);

router.get("/", authenticateToken, getAllUsers);

router.get("/", authenticateToken, getAllLecturers);

router.get("/me", authenticateToken, (req, res) => {
	req.params.id = req.user.id || req.user._id;
	getUserById(req, res);
});

router.get("/:id", authenticateToken, getUserById);
router.post("/", authenticateToken, authorizeRole(["Admin"]), createUser);
router.put("/:id", authenticateToken, updateUser);
router.delete("/:id", authenticateToken, authorizeRole(["Admin"]), deleteUser);
router.post("/change-password", changePassword);
router.post(
	"/:id/profile-image",
	authenticateToken,
	handleProfileImageUpload,
	uploadProfileImage
);
router.delete("/:id/profile-image", authenticateToken, removeProfileImage);
router.patch(
	"/:id/activate",
	authenticateToken,
	authorizeRole(["Admin", "competence_leader"]),
	activateUser
);
router.patch(
	"/:id/deactivate",
	authenticateToken,
	authorizeRole(["Admin", "competence_leader"]),
	deactivateUser
);
router.get("/:id/status", authenticateToken, getUserStatus);

export default router;

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

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *               - firstName
 *               - lastName
 *               - email
 *               - employmentType
 *             properties:
 *               username:
 *                 type: string
 *                 example: jdoe
 *               password:
 *                 type: string
 *                 example: Password123!
 *               role:
 *                 type: string
 *                 example: Admin
 *               title:
 *                 type: string
 *                 example: Mag.
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phoneNumber:
 *                 type: string
 *                 example: "+43123456789"
 *               employmentType:
 *                 type: string
 *                 example: 'Internal'
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – Admin role required
 *       500:
 *         description: Failed to create user
 */

/**
 * @openapi
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change a user's password
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               currentPassword:
 *                 type: string
 *                 example: OldPassword123
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123
 *               confirmPassword:
 *                 type: string
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing or invalid input
 *       500:
 *         description: Failed to change password
 */

/**
 * @openapi
 * /api/v1/users/{id}/profile-image:
 *   post:
 *     summary: Upload a profile image for a user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: Invalid user ID or no file provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to upload profile image
 */

/**
 * @openapi
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: jdoe
 *               role:
 *                 type: string
 *                 example: competence_leader
 *               title:
 *                 type: string
 *                 example: Mag.
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phoneNumber:
 *                 type: string
 *                 example: "+43123456789"
 *               employmentType:
 *                 type: string
 *                 example: FullTime
 *               skills:
 *                 type: array
 *                 description: Update user skills and levels
 *                 items:
 *                   type: object
 *                   properties:
 *                     skill:
 *                       type: string
 *                       example: 64b9876fedcb54321a098765
 *                     level:
 *                       type: string
 *                       example: Advanced
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 */

/**
 * @openapi
 * /api/v1/users/{id}/activate:
 *   patch:
 *     summary: Activate a user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – insufficient role
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to activate user
 */

/**
 * @openapi
 * /api/v1/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – insufficient role
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to deactivate user
 */

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – Admin role required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */

/**
 * @openapi
 * /api/v1/users/{id}/profile-image:
 *   delete:
 *     summary: Remove a user's profile image
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     responses:
 *       200:
 *         description: Profile image removed successfully
 *       400:
 *         description: Invalid user ID or no profile image exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to remove profile image
 */
