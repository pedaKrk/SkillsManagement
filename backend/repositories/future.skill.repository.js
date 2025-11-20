import FutureSkill from '../models/future.skill.model.js'

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
        FutureSkill.findByIdAndUpdate(id, data, { new: true })

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
            { $unwind: '$skill' },
            {
                $group: {
                    _id: { skill: '$skill.name', level: '$future_achievable_level' },
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
    }

    getUserFutureSkillLevelMatrix = (userId) => {
        return FutureSkill.aggregate([
            { $match: { lecturer_id: userId } },
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_id',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: '$skill' },
            {
                $group: {
                    _id: { skill: '$skill.name', level: '$future_achievable_level' },
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
    }
}

export const futureSkillRepository = new FutureSkillRepository();
