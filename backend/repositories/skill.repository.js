import Skill from "../models/skill.model.js";

export const findAllSkills = () => Skill.find()

export const findSkillById = (id) => Skill.findById(id)

export const findSkillByName = (name) => Skill.findOne({ name: name })

export const createSkill = (data) => new Skill(data).save()

export const updateSkill = (id, data) => {
    // Create a copy of data without children to avoid overwriting
    const updateData = { ...data }
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

export const deleteSkill = (id) => Skill.findByIdAndDelete(id)

// Hierarchie-Management
export const addChildToParent = async (parentId, childId) => {
    return await Skill.findByIdAndUpdate(
        parentId, 
        { $addToSet: { children: childId } }, 
        { new: true }
    )
}

export const removeChildFromParent = async (parentId, childId) => {
    return await Skill.findByIdAndUpdate(
        parentId, 
        { $pull: { children: childId } }, 
        { new: true }
    )
}

export const updateSkillHierarchy = async (skillId, newParentId, oldParentId) => {
    const updates = []
    
    updates.push(Skill.findByIdAndUpdate(skillId, { parent_id: newParentId }, { new: true }))

    if (newParentId) {
        updates.push(addChildToParent(newParentId, skillId))
    }

    if (oldParentId) {
        updates.push(removeChildFromParent(oldParentId, skillId))
    }
    
    return await Promise.all(updates)
}

export const deleteSkillWithChildren = async (skillId) => {

    const skill = await Skill.findById(skillId)
    if (skill && skill.children.length > 0) {
        for (const childId of skill.children) {
            await deleteSkillWithChildren(childId)
        }
    }
  
    return await Skill.findByIdAndDelete(skillId)
}
