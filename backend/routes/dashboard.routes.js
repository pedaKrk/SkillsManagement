import express from 'express';
import {
    getSkillsLevelMatrix,
    getSkillsByLevel,
    getSkillsPopularity,
    getUserFutureSkillLevelMatrix, getUserSkillDistribution, getLecturersSkillFields, getFutureSkillsGrowth
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/skills-level-matrix', getSkillsLevelMatrix);
router.get('/skills-by-level', getSkillsByLevel);
router.get('/skills-popularity', getSkillsPopularity);
router.get('/lecturers-skill-fields', getLecturersSkillFields);
router.get('/future-skills-growth', getFutureSkillsGrowth);



router.get('/user/:userId/future-skills-level-matrix', getUserFutureSkillLevelMatrix);
router.get('/user/:userId/skills/distribution', getUserSkillDistribution);
/*
router.get('/user/:userId/skills-by-level', getUserSkillsByLevel);
router.get('/user/:userId/skills-popularity', getUserSkillsPopularity);
router.get('/user/:userId/fields-popularity', getUserFieldsPopularity);

 */

export default router;
