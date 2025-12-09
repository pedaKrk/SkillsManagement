import Skills from "../models/skill.model.js";
import FutureSkills from '../models/future.skill.model.js';
import skillLevelEnum from '../models/enums/skill.level.enum.js';
import {futureSkillRepository} from "../repositories/future.skill.repository.js";
import DashboardService from "../services/dashboard.service.js";
import User from "../models/user.model.js";

//Todo: move logic in repository and service

// GET /api/v1/dashboard/skills-level-matrix
export const getSkillsLevelMatrix = async (req, res) => {
    try {
        const result = await FutureSkills.aggregate([
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_id',      // OLD FIELD NAME
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: '$skill' },
            {
                $group: {
                    _id: { skill: '$skill.name', level: '$future_achievable_level' },   // OLD FIELD NAME
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.skill',
                    levels: {
                        $push: {
                            level: '$_id.level',
                            count: '$count'
                        }
                    }
                }
            },
            {
                $project: {
                    name: '$_id',
                    series: {
                        $map: {
                            input: '$levels',
                            as: 'lvl',
                            in: {
                                name: '$$lvl.level',
                                value: '$$lvl.count'
                            }
                        }
                    }
                }
            }
        ]);

        res.status(200).json(result);

    } catch (err) {
        console.error('Error generating skills-level matrix:', err);
        res.status(500).json({ message: 'Failed to generate skills-level matrix' });
    }
};

// GET /api/v1/dashboard/skills-by-level
export const getSkillsByLevel = async (req, res) => {
    try {
        const levels = Object.values(skillLevelEnum);
        const data = [];

        for (const level of levels) {
            const count = await FutureSkills.countDocuments({ future_achievable_level: level });  // OLD FIELD NAME
            data.push({ name: level, value: count });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Error in getSkillsByLevel:', err);
        res.status(500).json({ message: 'Failed to load skills by level', error: err });
    }
};

// GET /api/v1/dashboard/skills-popularity
export const getSkillsPopularity = async (req, res) => {
    try {
        const skills = await FutureSkills.aggregate([
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_id',   // OLD FIELD NAME
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: '$skill' },
            {
                $group: {
                    _id: '$skill.name',
                    value: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    value: 1
                }
            }
        ]);

        res.status(200).json(skills);
    } catch (err) {
        console.error('Error in getSkillsPopularity:', err);
        res.status(500).json({ message: 'Failed to load skills popularity', error: err });
    }
};

// GET /api/v1/dashboard/fields-popularity
export const getFieldsPopularity = async (req, res) => {
    try {
        const result = await FutureSkills.aggregate([
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skillId',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: '$skill' },
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill.parent_id',
                    foreignField: '_id',
                    as: 'parentSkill'
                }
            },
            {
                $unwind: {
                    path: '$parentSkill',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {
                        $ifNull: ['$parentSkill.name', '$skill.name']
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: '$_id',
                    value: '$count',
                    _id: 0
                }
            }
        ]);

        res.status(200).json(result);
    } catch (err) {
        console.error('Error fetching Fields Popularity:', err);
        res.status(500).json({ message: 'Error fetching Fields Popularity', error: err });
    }
};

export const getUserFutureSkillLevelMatrix = async (req, res) => {
    try{
        const {userId} = req.params;
        const data = await futureSkillRepository.getUserFutureSkillLevelMatrix(userId)
        console.log(data)
        return data
    }catch(err){
        console.error('Error in getUserFutureSkillLevelMatrix:', err);
        res.status(500).json({ message: 'Failed to getUserFutureSkillLevelMatrix', error: err });
    }
};

export const getUserSkillDistribution = async (req, res) => {
    try{
        const {userId} = req.params;
        return res.status(200).json( await DashboardService.getUserSkillDistribution(userId))
    }catch(err){
        console.error('Error in getUserSkillDistribution:', err);
        res.status(500).json({ message: 'Failed to getUserSkillDistribution', error: err });
    }
}
export const getGoalsPerformance = async (req, res) => {
    try {
        const users = await User.find({})
            .populate("skills.skill")         // populate old skills
            .populate("futureSkills");        // populate future goals

        let reached = 0;
        let delayed = 0;

        for (const user of users) {

            if (!user.futureSkills) continue;

            for (const fs of user.futureSkills) {

                // ✔ Ensure fs.skill_id exists
                if (!fs.skill_id) continue;

                // Match futureSkill.skill_id with user.skills.skill
                const hasReached = user.skills?.some(s => {
                    if (!s.skill) return false;

                    const userSkillId = s.skill._id ? s.skill._id.toString() : s.skill.toString();
                    const futureSkillId = fs.skill_id._id ? fs.skill_id._id.toString() : fs.skill_id.toString();

                    return userSkillId === futureSkillId;
                });

                const pastDeadline = fs.target_date && (new Date() > new Date(fs.target_date));

                if (hasReached) {
                    reached++;
                } else if (pastDeadline) {
                    delayed++;
                }
            }
        }

        return res.json([
            { name: "Reached", value: reached },
            { name: "Delayed", value: delayed }
        ]);

    } catch (error) {
        console.error("Error calculating goals performance:", error);
        res.status(500).json({ message: "Failed to calculate goals performance" });
    }
};
export const getLecturersSkillFields = async (req, res) => {
    try {
        // Load all future skills with lecturer + skill hierarchy
        const futureSkills = await FutureSkills.find({})
            .populate("lecturer_id")
            .populate({ path: "skill_id", model: "Skills" })
            .lean();

        const allSkills = await Skills.find({}).lean();

        // Helper to find root field
        const findRoot = (skill) => {
            if (!skill) return null;

            let current = allSkills.find(s => s._id.toString() === skill._id.toString());
            if (!current) return null;

            while (current.parent_id) {
                const parent = allSkills.find(s => s._id.toString() === current.parent_id.toString());
                if (!parent) break;
                current = parent;
            }

            return current;
        };

        const lecturerFields = {}; // { lecturerId: Set(fields...) }

        // Build field list for each lecturer
        for (const fs of futureSkills) {
            const lecturer = fs.lecturer_id;
            const skill = fs.skill_id;

            if (!lecturer || !skill) continue;

            const root = findRoot(skill);
            if (!root?.name) continue;

            if (!lecturerFields[lecturer._id]) {
                lecturerFields[lecturer._id] = new Set();
            }

            lecturerFields[lecturer._id].add(root.name);
        }

        // Count how many lecturers belong to each field
        const counts = {};

        for (const lecturerId in lecturerFields) {
            for (const field of lecturerFields[lecturerId]) {
                counts[field] = (counts[field] || 0) + 1;
            }
        }

        // Convert to ngx-charts format
        const result = Object.entries(counts).map(([name, value]) => ({
            name,
            value
        }));

        return res.status(200).json(result);

    } catch (err) {
        console.error("\n🔥 ERROR in getLecturersSkillFields:");
        console.error("Message:", err.message);
        console.error("Full error object:", err);
        console.error("Stack:", err.stack);
        return res.status(500).json({ message: "Backend error", error: err.message });
    }

};
