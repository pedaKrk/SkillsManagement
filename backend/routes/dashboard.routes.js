import express from 'express';
import {
    getSkillsLevelMatrix,
    getSkillsByLevel,
    getSkillsPopularity,
    getFieldsPopularity,
    getUserFutureSkillLevelMatrix
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/skills-level-matrix', getSkillsLevelMatrix);
router.get('/skills-by-level', getSkillsByLevel);
router.get('/skills-popularity', getSkillsPopularity);
router.get('/fields-popularity', getFieldsPopularity);


router.get('/user/:userId/future-skills-level-matrix', getUserFutureSkillLevelMatrix);
/*
router.get('/user/:userId/skills-by-level', getUserSkillsByLevel);
router.get('/user/:userId/skills-popularity', getUserSkillsPopularity);
router.get('/user/:userId/fields-popularity', getUserFieldsPopularity);

 */

export default router;
