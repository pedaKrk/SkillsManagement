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
    console.log("📌 ENTERED getLecturersSkillFields");

    try {
        console.log("📌 Loading future skills...");
        const futures = await FutureSkills.find({})
            .populate("skill_id")
            .populate("lecturer_id")
            .lean();

        console.log("📌 FutureSkills count:", futures.length);
        console.log("📌 Example future skill:", futures[0]);

        console.log("📌 Loading skills collection...");
        const allSkills = await Skills.find({}).lean();
        console.log("📌 Skills count:", allSkills.length);

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

        const result = [];

        for (const fs of futures) {
            if (!fs.skill_id) {
                console.log("⚠ Missing skill_id for", fs);
                continue;
            }

            const root = findRoot(fs.skill_id);

            if (!root) {
                console.log("⚠ No root found for skill:", fs.skill_id.name);
                continue;
            }

            result.push({
                name: `${fs.skill_id.name} (${root.name})`,
                value: 1
            });
        }

        console.log("📌 Final result:", result);

        return res.status(200).json(result);

    } catch (err) {
        console.error("🔥 ERROR in getLecturersSkillFields:", err);
        return res.status(500).json({ message: "Failed", error: err.toString() });
    }
};

