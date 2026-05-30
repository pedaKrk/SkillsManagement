import mongoose from 'mongoose';
import UserRepository from "../repositories/user.repository.js";
import SkillRepository from "../repositories/skill.repository.js";
import {futureSkillRepository} from "../repositories/future.skill.repository.js";
import skillLevelEnum from "../models/enums/skill.level.enum.js";
import FutureSkill from '../models/future.skill.model.js';
import User from '../models/user.model.js';

class DashboardService {
    getLatestSkillLevelExpression() {
        return { $arrayElemAt: ['$skills.levelHistory', -1] };
    }

    async getNormalSkillIds(rootSkillId) {
        if (!rootSkillId) {
            return null;
        }

        if (!mongoose.Types.ObjectId.isValid(rootSkillId)) {
            throw new Error('Invalid rootSkillId');
        }

        return (await SkillRepository.getSkillTreeIds(rootSkillId))
            .map(id => new mongoose.Types.ObjectId(id));
    }

    getNormalSkillsBaseAggregation(skillIds = null) {
        const pipeline = [
            { $unwind: '$skills' }
        ];

        if (skillIds) {
            pipeline.push({ $match: { 'skills.skill': { $in: skillIds } } });
        }

        pipeline.push(
            {
                $addFields: {
                    latestLevel: this.getLatestSkillLevelExpression()
                }
            },
            {
                $match: {
                    'latestLevel.level': { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skills.skill',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: '$skill' }
        );

        return pipeline;
    }

    async getNormalSkillsLevelMatrix(skillIds = null) {
        return await User.aggregate([
            ...this.getNormalSkillsBaseAggregation(skillIds),
            {
                $group: {
                    _id: {
                        skill: '$skill.name',
                        level: '$latestLevel.level'
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
            },
            { $sort: { name: 1 } }
        ]);
    }

    async getNormalSkillsByLevel(skillIds = null) {
        const counts = await User.aggregate([
            ...this.getNormalSkillsBaseAggregation(skillIds),
            {
                $group: {
                    _id: '$latestLevel.level',
                    value: { $sum: 1 }
                }
            }
        ]);

        const countsByLevel = new Map(counts.map(item => [item._id, item.value]));

        return Object.values(skillLevelEnum).map(level => ({
            name: level,
            value: countsByLevel.get(level) || 0
        }));
    }

    async getNormalSkillsPopularity(skillIds = null) {
        return await User.aggregate([
            ...this.getNormalSkillsBaseAggregation(skillIds),
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
            },
            { $sort: { value: -1, name: 1 } }
        ]);
    }

    async getNormalLecturersCount(skillIds = null) {
        const query = skillIds
            ? { 'skills.skill': { $in: skillIds } }
            : { 'skills.0': { $exists: true } };

        return (await User.distinct('_id', query)).length;
    }

    async getNormalLecturersSkillFields(skillIds = null) {
        const query = skillIds
            ? { 'skills.skill': { $in: skillIds } }
            : { 'skills.0': { $exists: true } };

        const users = await User.find(query)
            .select('skills.skill')
            .populate('skills.skill', 'name parent_id')
            .lean();

        const allSkills = await SkillRepository.findAllSkills().lean();

        const findRoot = (skill) => {
            if (!skill) return null;

            let current = allSkills.find(
                s => s._id.toString() === skill._id.toString()
            );

            while (current?.parent_id) {
                const parent = allSkills.find(
                    s => s._id.toString() === current.parent_id.toString()
                );
                if (!parent) break;
                current = parent;
            }

            return current;
        };

        const allowedIds = skillIds
            ? new Set(skillIds.map(id => id.toString()))
            : null;
        const counter = new Map();

        for (const user of users) {
            for (const entry of user.skills || []) {
                const skill = entry.skill;
                if (!skill) continue;
                if (allowedIds && !allowedIds.has(skill._id.toString())) continue;

                const root = findRoot(skill);
                if (!root) continue;

                const key = `${skill.name} (${root.name})`;
                counter.set(key, (counter.get(key) || 0) + 1);
            }
        }

        return Array.from(counter.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }

    async getNormalSkillsGrowth(skillIds = null) {
        return await User.aggregate([
            ...this.getNormalSkillsBaseAggregation(skillIds),
            {
                $match: {
                    'latestLevel.changedAt': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$latestLevel.changedAt' },
                        month: { $month: '$latestLevel.changedAt' }
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
    }

    async getNormalLecturerEngagementTop5(skillIds = null) {
        return await User.aggregate([
            ...this.getNormalSkillsBaseAggregation(skillIds),
            {
                $group: {
                    _id: '$_id',
                    firstName: { $first: '$firstName' },
                    lastName: { $first: '$lastName' },
                    value: { $sum: 1 }
                }
            },
            { $sort: { value: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    name: {
                        $concat: ['$firstName', ' ', '$lastName']
                    },
                    value: 1
                }
            }
        ]);
    }

    async getNormalSkillsDashboardData(rootSkillId = null) {
        const skillIds = await this.getNormalSkillIds(rootSkillId);

        return {
            skillsLevelMatrix: await this.getNormalSkillsLevelMatrix(skillIds),
            skillsByLevel: await this.getNormalSkillsByLevel(skillIds),
            skillsPopularity: await this.getNormalSkillsPopularity(skillIds),
            lecturersSkillFields: await this.getNormalLecturersSkillFields(skillIds),
            skillsGrowth: await this.getNormalSkillsGrowth(skillIds),
            lecturersCount: await this.getNormalLecturersCount(skillIds),
            lecturerEngagementTop5: await this.getNormalLecturerEngagementTop5(skillIds),
        };
    }

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
