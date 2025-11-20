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
            updates.push(addChildToParent(newParentId, skillId))
        }

        if (oldParentId) {
            updates.push(removeChildFromParent(oldParentId, skillId))
        }

        return await Promise.all(updates)
    }

    deleteSkillWithChildren = async (skillId) => {

        const skill = await Skill.findById(skillId)
        if (skill && skill.children.length > 0) {
            for (const childId of skill.children) {
                await deleteSkillWithChildren(childId)
            }
        }

        return await Skill.findByIdAndDelete(skillId)
    }
}

export default new SkillRepository()
