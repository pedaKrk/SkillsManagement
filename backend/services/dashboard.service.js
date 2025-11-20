import UserRepository from "../repositories/user.repository.js";
import SkillRepository from "../repositories/skill.repository.js";

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
}

export default new DashboardService();