import mongoose from 'mongoose';
import UserRepository from "../repositories/user.repository.js";
import SkillRepository from "../repositories/skill.repository.js";
import {futureSkillRepository} from "../repositories/future.skill.repository.js";
import skillLevelEnum from "../models/enums/skill.level.enum.js";
import FutureSkill from '../models/future.skill.model.js';

class DashboardService {
    async getUserSkillDistribution(userId) {
        const allSkills = await SkillRepository.findAllSkills();
        const userDoc = await UserRepository.findUserSkills(userId);
        const userSkills = userDoc.skills || [];
        const skillMap = new Map(allSkills.map(skill => [skill._id.toString(), skill]));
        const rootSkills = allSkills.filter(skill => !skill.parent_id);

        // initialize counter for every rootSkills to 0
        const counts = new Map(rootSkills.map(rootSkill => [rootSkill._id.toString(), 0]));

        for (const userSkill of userSkills) {
            let skill = skillMap.get(userSkill.skill.toString());
            while (skill) {
                if (!skill.parent_id) {
                    const rootId = skill._id.toString();
                    counts.set(rootId, counts.get(rootId) + 1);
                    break;
                }

                skill = skillMap.get(skill.parent_id.toString());
            }
        }

        return rootSkills.map(rootSkill => ({
            rootSkillId: rootSkill._id,
            rootSkillName: rootSkill.name,
            count: counts.get(rootSkill._id.toString()),
        }))
    }

    async getSkillsLevelMatrix() {
        return await futureSkillRepository.getFutureSkillLevelMatrix();
    }

    async getSkillsByLevel() {
        const levels = Object.values(skillLevelEnum);
        const data = [];

        for (const level of levels) {
            const count = await futureSkillRepository.countFutureSkillsByLevel(level);
            data.push({name: level, value: count});
        }

        return data;
    }

    async getLecturersCount() {
        const lecturerIds = await FutureSkill.distinct('lecturer_id');
        return lecturerIds.length;
    }


    async getLecturersSkillFields() {
        return await futureSkillRepository.getLecturersSkillFields();
    }

    async getFutureSkillsGrowth() {
        return await futureSkillRepository.getFutureSkillsGrowthByMonth();
    }

    async getSkillsPopularity() {
        return await futureSkillRepository.getSkillsPopularity();
    }

    async getUserFutureSkillLevelMatrix(userId) {
        return await futureSkillRepository.getUserFutureSkillLevelMatrix(userId);
    }

    async getLecturerEngagementTop5() {
        return await futureSkillRepository.getLecturerEngagementTop5();
    }

    async getSkillsPopularityByRootSkill(rootSkillId) {

        // 1️⃣ get all descendant skill IDs
        const skillIds = await SkillRepository.getSkillTreeIds(rootSkillId);

        // 2️⃣ delegate aggregation to repository
        return await futureSkillRepository.getSkillsPopularityBySkillIds(
            Array.from(skillIds)
        );
    }
    async getSkillsByLevelByRootSkill(skillIds) {
        const levels = Object.values(skillLevelEnum);
        const data = [];

        for (const level of levels) {
            const count = await FutureSkill.countDocuments({
                future_achievable_level: level,
                skill_id: { $in: skillIds }
            });

            data.push({ name: level, value: count });
        }

        return data;
    }


    async getDashboardDataByTopLevelSkill(rootSkillId) {

        if (!mongoose.Types.ObjectId.isValid(rootSkillId)) {
            throw new Error('Invalid rootSkillId');
        }

        // 🔑 THIS IS THE KEY STEP
        const skillIds = (await SkillRepository.getSkillTreeIds(rootSkillId))
            .map(id => new mongoose.Types.ObjectId(id));

        return {
            // ✅ FILTERED CORRECTLY
            skillsPopularity: await FutureSkill.aggregate([
                { $match: { skill_id: { $in: skillIds } } },
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
                        _id: '$skill.name',
                        value: { $sum: 1 }
                    }
                },
                {
                    $project: { _id: 0, name: '$_id', value: 1 }
                }
            ]),

            skillsByLevel: await FutureSkill.aggregate([
                { $match: { skill_id: { $in: skillIds } } },
                {
                    $group: {
                        _id: '$future_achievable_level',
                        value: { $sum: 1 }
                    }
                },
                {
                    $project: { _id: 0, name: '$_id', value: 1 }
                }
            ]),

            lecturersCount: (
                await FutureSkill.distinct('lecturer_id', {
                    skill_id: { $in: skillIds }
                })
            ).length,

            futureSkillsGrowth: await FutureSkill.aggregate([
                { $match: { skill_id: { $in: skillIds } } },
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
            ]),

            // still global (fine for now)
            skillsLevelMatrix: await this.getSkillsLevelMatrixByRootSkill(skillIds),
            lecturersSkillFields: await this.getLecturersSkillFieldsByRootSkill(skillIds),
            lecturerEngagementTop5: await this.getLecturerEngagementTop5ByRootSkill(skillIds),

        };
    }

    async getSkillsLevelMatrixByRootSkill(skillIds) {
        return await FutureSkill.aggregate([
            {
                $match: {
                    skill_id: { $in: skillIds }
                }
            },
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
                    _id: {
                        skill: '$skill.name',
                        level: '$future_achievable_level'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.skill',
                    series: {
                        $push: {
                            name: '$_id.level',
                            value: '$count'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    series: 1
                }
            }
        ]);
    }

    async getLecturersSkillFieldsByRootSkill(skillIds) {

        const futures = await FutureSkill.find({
            skill_id: { $in: skillIds }
        })
            .populate('skill_id')
            .lean();

        const counter = new Map();

        for (const fs of futures) {
            if (!fs.skill_id) continue;

            const key = fs.skill_id.name;
            counter.set(key, (counter.get(key) || 0) + 1);
        }

        return Array.from(counter.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }
    async getLecturerEngagementTop5ByRootSkill(skillIds) {
        return await FutureSkill.aggregate([
            {
                $match: {
                    skill_id: { $in: skillIds }
                }
            },
            {
                $group: {
                    _id: '$lecturer_id',
                    value: { $sum: 1 }
                }
            },
            { $sort: { value: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'lecturer'
                }
            },
            { $unwind: '$lecturer' },
            {
                $project: {
                    _id: 0,
                    name: {
                        $concat: [
                            '$lecturer.firstName',
                            ' ',
                            '$lecturer.lastName'
                        ]
                    },
                    value: 1
                }
            }
        ]);
    }


}

    export default new DashboardService();