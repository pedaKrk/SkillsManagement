import express from 'express';
import {
    getSkillsLevelMatrix,
    getSkillsByLevel,
    getSkillsPopularity,
    getFieldsPopularity,
    getUserFutureSkillLevelMatrix, getUserSkillDistribution
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/skills-level-matrix', getSkillsLevelMatrix);
router.get('/skills-by-level', getSkillsByLevel);
router.get('/skills-popularity', getSkillsPopularity);
router.get('/fields-popularity', getFieldsPopularity);


router.get('/user/:userId/future-skills-level-matrix', getUserFutureSkillLevelMatrix);
router.get('/user/:userId/skills/distribution', getUserSkillDistribution);
/*
router.get('/user/:userId/skills-by-level', getUserSkillsByLevel);
router.get('/user/:userId/skills-popularity', getUserSkillsPopularity);
router.get('/user/:userId/fields-popularity', getUserFieldsPopularity);

 */

export default router;


//Swagger


/**
 * @openapi
 * /api/v1/dashboard/skills-level-matrix:
 *   get:
 *     summary: Returns a matrix of all skills grouped by level.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Skills level matrix retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */

/**
 * @openapi
 * /api/v1/dashboard/skills-by-level:
 *   get:
 *     summary: Returns all skills grouped by their proficiency levels.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Skills by level retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */

/**
 * @openapi
 * /api/v1/dashboard/skills-popularity:
 *   get:
 *     summary: Returns statistics about how popular each skill is.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Skills popularity retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */

/**
 * @openapi
 * /api/v1/dashboard/fields-popularity:
 *   get:
 *     summary: Returns statistics about how popular different fields/domains are.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Fields popularity retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */

/**
 * @openapi
 * /api/v1/dashboard/user/{userId}/future-skills-level-matrix:
 *   get:
 *     summary: Returns predicted future skill levels for a specific user.
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Future skills level matrix retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 */

/**
 * @openapi
 * /api/v1/dashboard/user/{userId}/skills/distribution:
 *   get:
 *     summary: Returns a distribution of all skills for a specific user.
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User skill distribution retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 */

