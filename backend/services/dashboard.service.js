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

        for(const userSkill of userSkills) {
            let skill = skillMap.get(userSkill.skill.toString());
            while(skill) {
                if(!skill.parent_id) {
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
            data.push({ name: level, value: count });
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



    async getDashboardDataByTopLevelSkill(rootSkillId) {

        // 1️⃣ Get all skills under selected domain
        const skillIds = await SkillRepository.getSkillTreeIds(rootSkillId);

        return {
            // still global (safe, already working)
            skillsLevelMatrix: await this.getSkillsLevelMatrix(),
            skillsByLevel: await this.getSkillsByLevel(),
            lecturersCount: await this.getLecturersCount(),

            // ✅ NOW ACTUALLY FILTERED
            skillsPopularity: await futureSkillRepository
                .getSkillsPopularityBySkillIds(skillIds),

            lecturersSkillFields: await this.getLecturersSkillFields(),
            futureSkillsGrowth: await this.getFutureSkillsGrowth(),
            lecturerEngagementTop5: await this.getLecturerEngagementTop5(),
        };
    }

}

export default new DashboardService();