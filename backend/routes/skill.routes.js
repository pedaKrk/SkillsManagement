import express from 'express'
const router = express.Router()
import {
    getAllSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill,
    getRootSkills,
    addFutureSkillToSkills,
    getAllSkillNames,
    getSkillLevels
} from '../controllers/skill.controller.js'
import {authenticateToken, authorizeRole} from '../middleware/auth.middleware.js'

router.post('/from-future/:futureSkillId', authenticateToken, addFutureSkillToSkills);
//public - specific routes must come before parameterized routes
router.get('/names', getAllSkillNames);
router.get('/levels', getSkillLevels);
router.get('/root', getRootSkills);
router.get('/', getAllSkills);
router.get('/:id', getSkillById);

// private
router.post('/', authenticateToken, authorizeRole(['Admin', 'competence_leader']), createSkill)
router.put('/:id', authenticateToken, authorizeRole(['Admin', 'competence_leader']), updateSkill)
router.delete('/:id', authenticateToken, authorizeRole(['Admin', 'competence_leader']), deleteSkill)

export default router



/**
 * @openapi
 * /api/v1/skills/names:
 *   get:
 *     summary: Returns a list of all skill names
 *     tags:
 *       - Skills
 *     responses:
 *       200:
 *         description: List of skill names retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["JavaScript", "Python", "React"]
 */

/**
 * @openapi
 * /api/v1/skills/levels:
 *   get:
 *     summary: Returns all skill levels
 *     tags:
 *       - Skills
 *     responses:
 *       200:
 *         description: List of skill levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Beginner", "Intermediate", "Advanced"]
 */
/**
 * @openapi
 * /api/v1/skills/root:
 *   get:
 *     summary: Returns all root skills (skills without a parent)
 *     tags:
 *       - Skills
 *     responses:
 *       200:
 *         description: List of root skills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                 example:
 *                   _id: "6486007a9cb9397bafe2e527"
 *                   name: "Programming Fundamentals"
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/v1/skills:
 *   get:
 *     summary: Returns all skills
 *     tags:
 *       - Skills
 *     responses:
 *       200:
 *         description: A list of skills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                 example:
 *                   _id: "675ab12f3a0c9b4f45eabc91"
 *                   name: "JavaScript"
 */

/**
 * @openapi
 * /api/v1/skills/{id}:
 *   get:
 *     summary: Returns a skill by ID
 *     tags:
 *       - Skills
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *               example:
 *                 _id: "675ab12f3a0c9b4f45eabc91"
 *                 name: "JavaScript"
 *       404:
 *         description: Skill not found
 */
