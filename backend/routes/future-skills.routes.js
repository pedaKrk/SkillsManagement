import express from 'express';
const router = express.Router();

import {
    getAllSkillNames,
    getSkillLevels,
    getAllFutureSkills,
    createFutureSkill,
    updateFutureSkill,
    deleteFutureSkill
} from '../controllers/future.skills.controller.js';
import {authenticateToken} from "../middleware/auth.middleware.js";

// GET all future skills
router.get('/', getAllFutureSkills);

// POST a new future skill
router.post('/', createFutureSkill);

// PUT (update) a skill by ID
router.put('/:id', updateFutureSkill);

// DELETE a skill by ID
router.delete('/:id', deleteFutureSkill);

// ✅ NEW: GET distinct skill names
router.get('/skill-names', getAllSkillNames);

// ✅ NEW: GET skill levels
router.get('/skill-levels', getSkillLevels);

export default router;
