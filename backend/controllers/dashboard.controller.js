import DashboardService from "../services/dashboard.service.js";
import logger from "../config/logger.js";

// GET /api/v1/dashboard/skills-level-matrix
export const getSkillsLevelMatrix = async (req, res) => {
    try {
        const result = await DashboardService.getSkillsLevelMatrix();
        res.status(200).json(result);
    } catch (err) {
        logger.error('Error generating skills-level matrix:', err);
        res.status(500).json({ message: 'Failed to generate skills-level matrix' });
    }
};

// GET /api/v1/dashboard/lecturers-count
export const getLecturersCount = async (req, res) => {
    try {
        const count = await DashboardService.getLecturersCount();
        res.status(200).json({ value: count });
    } catch (err) {
        console.error('getLecturersCount error:', err);
        res.status(500).json({ message: 'Failed to load lecturers count' });
    }
};

// GET /api/v1/dashboard/skills-by-level
export const getSkillsByLevel = async (req, res) => {
    try {
        const data = await DashboardService.getSkillsByLevel();
        res.status(200).json(data);
    } catch (err) {
        logger.error('Error in getSkillsByLevel:', err);
        res.status(500).json({ message: 'Failed to load skills by level', error: err });
    }
};

// GET /api/v1/dashboard/skills-popularity?rootSkillId=123
export const getSkillsPopularity = async (req, res) => {
    try {
        const { rootSkillId } = req.query;

        const data = rootSkillId
            ? await DashboardService.getSkillsPopularityByRootSkill(rootSkillId)
            : await DashboardService.getSkillsPopularity();

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: 'Failed', error: err.toString() });
    }
};



// GET /api/v1/dashboard/lecturers-skill-fields
export const getLecturersSkillFields = async (req, res) => {
    try {
        const data = await DashboardService.getLecturersSkillFields();
        res.status(200).json(data);
    } catch (err) {
        logger.error('Error in getLecturersSkillFields:', err);
        res.status(500).json({
            message: 'Failed to load lecturers skill fields',
            error: err.toString()
        });
    }
};


// GET /api/v1/dashboard/future-skills-growth
export const getFutureSkillsGrowth = async (req, res) => {
    try {
        const data = await DashboardService.getFutureSkillsGrowth();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            message: 'Failed to load future skills growth',
            error: err.toString()
        });
    }
};


export const getUserFutureSkillLevelMatrix = async (req, res) => {
    try{
        const {userId} = req.params;
        const data = await DashboardService.getUserFutureSkillLevelMatrix(userId);
        res.status(200).json(data);
    }catch(err){
        logger.error('Error in getUserFutureSkillLevelMatrix:', err);
        res.status(500).json({ message: 'Failed to getUserFutureSkillLevelMatrix', error: err });
    }
};

export const getUserSkillDistribution = async (req, res) => {
    try{
        const {userId} = req.params;
        const data = await DashboardService.getUserSkillDistribution(userId);
        res.status(200).json(data);
    }catch(err){
        logger.error('Error in getUserSkillDistribution:', err);
        res.status(500).json({ message: 'Failed to getUserSkillDistribution', error: err });
    }
}

// GET /api/v1/dashboard/lecturer-engagement
export const getLecturerEngagementTop5 = async (req, res) => {
    try {
        const data = await DashboardService.getLecturerEngagementTop5();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            message: 'Failed to load lecturer engagement',
            error: err.toString()
        });
    }
};

// GET /api/v1/dashboard/by-root-skill/:rootSkillId
export const getDashboardByRootSkill = async (req, res) => {
    try {
        const { rootSkillId } = req.params;

        const data = await DashboardService.getDashboardDataByTopLevelSkill(rootSkillId);

        res.status(200).json(data);
    } catch (err) {
        console.error('🔥 DASHBOARD ROOT SKILL ERROR 🔥');
        console.error(err);          // <<< THIS IS CRITICAL
        console.error(err.stack);    // <<< THIS IS CRITICAL

        res.status(500).json({
            message: 'Failed to load dashboard data for root skill',
            error: err.message
        });
    }
};

// GET /api/v1/dashboard/normal-skills
export const getNormalSkillsDashboard = async (req, res) => {
    try {
        const data = await DashboardService.getNormalSkillsDashboardData();
        res.status(200).json(data);
    } catch (err) {
        logger.error('Error loading normal skills dashboard:', err);
        res.status(500).json({
            message: 'Failed to load normal skills dashboard',
            error: err.message
        });
    }
};

// GET /api/v1/dashboard/normal-skills/by-root-skill/:rootSkillId
export const getNormalSkillsDashboardByRootSkill = async (req, res) => {
    try {
        const { rootSkillId } = req.params;
        const data = await DashboardService.getNormalSkillsDashboardData(rootSkillId);
        res.status(200).json(data);
    } catch (err) {
        logger.error('Error loading normal skills dashboard by root skill:', err);
        res.status(500).json({
            message: 'Failed to load normal skills dashboard for root skill',
            error: err.message
        });
    }
};


