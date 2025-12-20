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

// GET /api/v1/dashboard/skills-popularity
export const getSkillsPopularity = async (req, res) => {
    try {
        const skills = await DashboardService.getSkillsPopularity();
        res.status(200).json(skills);
    } catch (err) {
        logger.error('Error in getSkillsPopularity:', err);
        res.status(500).json({ message: 'Failed to load skills popularity', error: err });
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


