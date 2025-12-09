import express from 'express';
const router = express.Router();

import {
    getAllFutureSkills,
    createFutureSkill,
    updateFutureSkill,
    deleteFutureSkill,
    sendFutureSkillMail
} from '../controllers/future.skills.controller.js';
import {getFutureSkillStatusEmail} from "../controllers/email.controller.js";
import {authenticateToken} from "../middleware/auth.middleware.js";

// GET all future skills
router.get('/', getAllFutureSkills);

// POST a new future skill
router.post('/', createFutureSkill);

// PUT (update) a skill by ID
router.put('/:id', updateFutureSkill);

// DELETE a skill by ID
router.delete('/:id', deleteFutureSkill);

router.post('/send-email', sendFutureSkillMail);

export default router;
