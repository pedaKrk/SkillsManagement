import express from 'express'
const router = express.Router()
import {getAllSkills, getSkillById, createSkill, updateSkill, deleteSkill} from '../controllers/skill.controller.js'

router.get('/', getAllSkills)
router.get('/:id', getSkillById)
router.post('/', createSkill)
router.put('/:id', updateSkill)
router.delete('/:id', deleteSkill)

export default router