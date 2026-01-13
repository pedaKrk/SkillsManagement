import Skill from "../models/skill.model.js";

class SkillRepository {

    findAllSkills = () => Skill.find()

    findSkillById = (id) => Skill.findById(id)

    findSkillByName = (name) => Skill.findOne({name: name})

    createSkill = (data) => new Skill(data).save()

    updateSkill = (id, data) => {
        // Create a copy of data without children to avoid overwriting
        const updateData = {...data}
        if (!updateData.children) {
            delete updateData.children
        }

        return Skill.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        )
    }

    deleteSkill = (id) => Skill.findByIdAndDelete(id)

    getTopLevelSkills = () => {
        return Skill.find({ parent_id: null })
            .select('_id name');
    };

    // Hierarchie-Management
    addChildToParent = async (parentId, childId) => {
        return await Skill.findByIdAndUpdate(
            parentId,
            {$addToSet: {children: childId}},
            {new: true}
        )
    }

    removeChildFromParent = async (parentId, childId) => {
        return await Skill.findByIdAndUpdate(
            parentId,
            {$pull: {children: childId}},
            {new: true}
        )
    }

    updateSkillHierarchy = async (skillId, newParentId, oldParentId) => {
        const updates = []

        updates.push(Skill.findByIdAndUpdate(skillId, {parent_id: newParentId}, {new: true}))

        if (newParentId) {
            updates.push(this.addChildToParent(newParentId, skillId))
        }

        if (oldParentId) {
            updates.push(this.removeChildFromParent(oldParentId, skillId))
        }

        return await Promise.all(updates)
    }

    deleteSkillWithChildren = async (skillId) => {

        const skill = await Skill.findById(skillId)
        if (skill && skill.children.length > 0) {
            for (const childId of skill.children) {
                await this.deleteSkillWithChildren(childId)
            }
        }

        return await Skill.findByIdAndDelete(skillId)
    }

    getSkillTreeIds = async (rootSkillId) => {
        const skills = await Skill.find()
            .select('_id parent_id')
            .lean();

        const result = new Set([rootSkillId.toString()]);
        let changed = true;

        while (changed) {
            changed = false;

            for (const skill of skills) {
                if (!skill.parent_id) continue; // ✅ GUARD

                const parentId = skill.parent_id.toString();
                const skillId = skill._id.toString();

                if (result.has(parentId) && !result.has(skillId)) {
                    result.add(skillId);
                    changed = true;
                }
            }
        }

        return Array.from(result);
    };





}

export default new SkillRepository()
