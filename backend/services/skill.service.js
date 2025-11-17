import{skillRepository} from '../repositories/skill.repository.js'
import {NotFoundError} from "../errors/not.found.error.js";

class SkillService {
    getAllSkills = async () => {
        try {
            return await skillRepository.findAllSkills()
        } catch (error) {
            throw error
        }
    }

    getSkillById = async (id) => {
        try {
            const skill = await skillRepository.findSkillById(id)
            if (!skill) {
                throw new NotFoundError(`Skill with id ${id} not found`)
            }

            return skill
        } catch (error) {
            throw error
        }
    }

    createSkill = async (data) => {
        try {
            // Check if skill name already exists
            const existingSkill = await skillRepository.findSkillByName(data.name)
            if (existingSkill) {
                throw new Error(`A skill with the name "${data.name}" already exists. Please choose a different name.`)
            }

            const newSkill = await skillRepository.createSkill(data)

            // if parent exist
            if (data.parent_id) {
                await skillRepository.addChildToParent(data.parent_id, newSkill._id)
            }

            return newSkill
        } catch (error) {
            throw error
        }
    }

    updateSkill = async (id, data) => {
        try {
            const skill = await skillRepository.findSkillById(id)
            if (!skill) {
                throw new NotFoundError(`Skill with id ${id} not found`)
            }

            const oldParentId = skill.parent_id
            const newParentId = data.parent_id

            // Only handle hierarchy changes if parent_id is being changed
            if (data.parent_id !== undefined && oldParentId !== newParentId) {
                await skillRepository.updateSkillHierarchy(id, newParentId, oldParentId)
                return await skillRepository.findSkillById(id)
            } else {

                const updateData = {...data}
                delete updateData.children
                delete updateData._id
                delete updateData.createdAt
                delete updateData.updatedAt

                const updated = await skillRepository.updateSkill(id, updateData)
                return updated
            }
        } catch (error) {
            throw error
        }
    }

    deleteSkill = async (id) => {
        try {
            const skill = await skillRepository.findSkillById(id)
            if (!skill) {
                throw new NotFoundError(`Skill with id ${id} not found`)
            }

            if (skill.parent_id) {
                await skillRepository.removeChildFromParent(skill.parent_id, id)
            }

            const deleted = await skillRepository.deleteSkillWithChildren(id)
            return deleted
        } catch (error) {
            throw error
        }
    }

    getRootSkills = async () => {
        try {
            const allSkills = await skillRepository.findAllSkills()
            return allSkills.filter(skill => !skill.parent_id)
        } catch (error) {
            throw error
        }
    }
}

export const skillService = new SkillService()

