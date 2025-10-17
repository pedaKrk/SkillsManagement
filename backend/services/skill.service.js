import * as skillRepository from '../repositories/skill.repository.js'
import {NotFoundError} from "../errors/not.found.error.js";

export const getAllSkills = async () => {
    try{
        return await skillRepository.findAllSkills()
    }catch(error){
        throw error
    }
}

export const getSkillById = async (id) => {
    try{
        const skill = await skillRepository.findSkillById()
        if(!skill){
            throw new NotFoundError(`Skill with id ${id} not found`)
        }

        return skill
    }catch(error){
        throw error
    }
}

export const createSkill = async (data) => {
    try{
        const newSkill = await skillRepository.createSkill(data)
        
        // if parent exist
        if (data.parent_id) {
            await skillRepository.addChildToParent(data.parent_id, newSkill._id)
        }
        
        return newSkill
    }catch(error){
        throw error
    }
}

export const updateSkill = async (id, data) => {
    try{
        const skill = await skillRepository.findSkillById(id)
        if(!skill){
            throw new NotFoundError(`Skill with id ${id} not found`)
        }
        
        const oldParentId = skill.parent_id
        const newParentId = data.parent_id

        if (oldParentId !== newParentId) {
            await skillRepository.updateSkillHierarchy(id, newParentId, oldParentId)
        } else {
            const updated = await skillRepository.updateSkill(id, data)
            return updated
        }
        
        return await skillRepository.findSkillById(id)
    }catch(error){
        throw error
    }
}

export const deleteSkill = async (id) => {
    try{
        const skill = await skillRepository.findSkillById(id)
        if(!skill){
            throw new NotFoundError(`Skill with id ${id} not found`)
        }

        if (skill.parent_id) {
            await skillRepository.removeChildFromParent(skill.parent_id, id)
        }

        const deleted = await skillRepository.deleteSkillWithChildren(id)
        return deleted
    }
    catch(error){
        throw error
    }
}

