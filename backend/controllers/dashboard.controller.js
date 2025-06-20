import FutureSkills from '../models/future-skill.model.js';
import skillLevelEnum from '../models/enums/skill.level.enum.js';

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
                    localField: 'skill_id',   // OLD FIELD NAME
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: '$skill' },
            {
                $match: { 'skill.category': { $exists: true, $ne: null } }
            },
            {
                $group: {
                    _id: { $ifNull: ['$skill.category', 'Unknown category'] },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: '$_id',
                    value: '$count'
                }
            }
        ]);

        res.status(200).json(result);
    } catch (err) {
        console.error('Error fetching Fields Popularity:', err);
        res.status(500).json({ message: 'Error fetching Fields Popularity', error: err });
    }
};
