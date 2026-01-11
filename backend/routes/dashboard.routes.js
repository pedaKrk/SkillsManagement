import express from 'express';
import {
    getSkillsLevelMatrix,
    getSkillsByLevel,
    getSkillsPopularity,
    getUserFutureSkillLevelMatrix,
    getUserSkillDistribution,
    getLecturersSkillFields,
    getFutureSkillsGrowth,
    getLecturersCount,
    getLecturerEngagementTop5,
    getDashboardByRootSkill
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/skills-level-matrix', getSkillsLevelMatrix);
router.get('/skills-by-level', getSkillsByLevel);
router.get('/lecturers-count', getLecturersCount);
router.get('/skills-popularity', getSkillsPopularity);
router.get('/lecturers-skill-fields', getLecturersSkillFields);
router.get('/future-skills-growth', getFutureSkillsGrowth);
router.get('/lecturer-engagement', getLecturerEngagementTop5);
router.get('/by-root-skill/:rootSkillId', getDashboardByRootSkill);




router.get('/user/:userId/future-skills-level-matrix', getUserFutureSkillLevelMatrix);
router.get('/user/:userId/skills/distribution', getUserSkillDistribution);
/*
router.get('/user/:userId/skills-by-level', getUserSkillsByLevel);
router.get('/user/:userId/skills-popularity', getUserSkillsPopularity);
router.get('/user/:userId/fields-popularity', getUserFieldsPopularity);

 */

export default router;
