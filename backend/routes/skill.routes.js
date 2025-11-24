import express from 'express'
const router = express.Router()
import {getAllSkills, getSkillById, createSkill, updateSkill, deleteSkill} from '../controllers/skill.controller.js'
import {authenticateToken, authorizeRole} from '../middleware/auth.middleware.js'

//public
router.get('/', getAllSkills)
router.get('/:id', getSkillById)

// private
router.post('/', authenticateToken, authorizeRole(['Admin', 'competence_leader']), createSkill)
router.put('/:id', authenticateToken, authorizeRole(['Admin', 'competence_leader']), updateSkill)
router.delete('/:id', authenticateToken, authorizeRole(['Admin', 'competence_leader']), deleteSkill)

export default router

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
 *       404:
 *         description: Skill not found
 */