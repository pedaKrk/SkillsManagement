import FutureSkill from '../models/future.skill.model.js'
import Skill from "../models/skill.model.js";

class FutureSkillRepository {

    findAllFutureSkills = () =>
        FutureSkill.find()
            .populate('lecturer_id', 'title firstName lastName')
            .populate('skill_id', 'name')

    createFutureSkill = (data) => new FutureSkill(data).save()

    // ✔️ MERGED VERSION (keeps the populate from the standalone one)
    findFutureSkillById = (id) =>
        FutureSkill.findById(id)
            .populate('skill_id')
            .populate('lecturer_id')

    updateFutureSkill = (id, data) =>
        FutureSkill.findByIdAndUpdate(id, data, {new: true})

    deleteFutureSkill = (id) =>
        FutureSkill.findByIdAndDelete(id)

    getFutureSkillLevelMatrix = () => {
        return FutureSkill.aggregate([
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_id',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            {$unwind: '$skill'},
            {
                $group: {
                    _id: {skill: '$skill.name', level: '$future_achievable_level'},
                    count: {$sum: 1}
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
    }

    getUserFutureSkillLevelMatrix = (userId) => {
        return FutureSkill.aggregate([
            {$match: {lecturer_id: userId}},
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_id',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            {$unwind: '$skill'},
            {
                $group: {
                    _id: {skill: '$skill.name', level: '$future_achievable_level'},
                    count: {$sum: 1}
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
    }

    countFutureSkillsByLevel = (level) => {
        return FutureSkill.countDocuments({future_achievable_level: level});
    }

    getSkillsPopularity = () => {
        return FutureSkill.aggregate([
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_id',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            {$unwind: '$skill'},
            {
                $group: {
                    _id: '$skill.name',
                    value: {$sum: 1}
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
    }


    async getLecturersSkillFields() {
        const futures = await FutureSkill.find({})
            .populate("skill_id")
            .lean();

        const allSkills = await Skill.find({}).lean();

        const findRoot = (skill) => {
            if (!skill) return null;

            let current = allSkills.find(
                s => s._id.toString() === skill._id.toString()
            );
            if (!current) return null;

            while (current.parent_id) {
                const parent = allSkills.find(
                    s => s._id.toString() === current.parent_id.toString()
                );
                if (!parent) break;
                current = parent;
            }

            return current;
        };

        const counter = new Map();

        for (const fs of futures) {
            if (!fs.skill_id) continue;

            const root = findRoot(fs.skill_id);
            if (!root) continue;

            const key = `${fs.skill_id.name} (${root.name})`;
            counter.set(key, (counter.get(key) || 0) + 1);
        }

        return Array.from(counter.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }

    getFutureSkillsGrowthByMonth = () => {
        return FutureSkill.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$target_date' },
                        month: { $month: '$target_date' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: {
                        $concat: [
                            { $toString: '$_id.year' },
                            '-',
                            {
                                $cond: [
                                    { $lt: ['$_id.month', 10] },
                                    { $concat: ['0', { $toString: '$_id.month' }] },
                                    { $toString: '$_id.month' }
                                ]
                            }
                        ]
                    },
                    value: '$count'
                }
            },
            { $sort: { name: 1 } }
        ]);
    };

}

    export const futureSkillRepository = new FutureSkillRepository();
