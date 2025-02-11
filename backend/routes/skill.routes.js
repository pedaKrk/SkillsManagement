import express from 'express'
const router = express.Router()
import skillController from '../controllers/skill.controller.js'

router.get('/', skillController.getAllSkills)
router.get('/:id', skillController.getSkillById)
router.post('/', skillController.createSkill)
router.put('/:id', skillController.updateSkill)
router.delete('/:id', skillController.deleteSkill)

export default router