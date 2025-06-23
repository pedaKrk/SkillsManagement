import express from 'express';
import {
    getSkillsLevelMatrix,
    getSkillsByLevel,
    getSkillsPopularity,
    getFieldsPopularity
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/skills-level-matrix', getSkillsLevelMatrix);
router.get('/skills-by-level', getSkillsByLevel);
router.get('/skills-popularity', getSkillsPopularity);
router.get('/fields-popularity', getFieldsPopularity);

export default router;
