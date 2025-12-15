import express from 'express';
import {
    getSkillsLevelMatrix,
    getSkillsByLevel,
    getSkillsPopularity,
    getFieldsPopularity,
    getUserFutureSkillLevelMatrix, getUserSkillDistribution, getGoalsPerformance, getLecturersSkillFields
} from '../controllers/dashboard.controller.js';
import {authenticateToken} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get('/skills-level-matrix', getSkillsLevelMatrix);
router.get('/skills-by-level', getSkillsByLevel);
router.get('/skills-popularity', getSkillsPopularity);
router.get('/goals-performance',getGoalsPerformance);
router.get('/lecturers-skill-fields',getLecturersSkillFields);



router.get('/user/:userId/future-skills-level-matrix', getUserFutureSkillLevelMatrix);
router.get('/user/:userId/skills/distribution', getUserSkillDistribution);
/*
router.get('/user/:userId/skills-by-level', getUserSkillsByLevel);
router.get('/user/:userId/skills-popularity', getUserSkillsPopularity);
router.get('/user/:userId/fields-popularity', getUserFieldsPopularity);

 */

export default router;
