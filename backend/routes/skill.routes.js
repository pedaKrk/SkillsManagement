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