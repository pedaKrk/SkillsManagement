import * as skillRepository from '../repositories/skill.repository'
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
        return await skillRepository.createSkill(data)
    }catch(error){
        throw error
    }
}

export const updateSkill = async (id, data) => {
    try{
        const updated = await skillRepository.updateSkill(id, data)
        if(!updated){
            throw new NotFoundError(`Skill with id ${id} not found`)
        }
        return updated
    }catch(error){
        throw error
    }
}

export const deleteSkill = async (id) => {
    try{
        const deleted = await skillRepository.deleteSkill(id)
        if(!deleted){
            throw new NotFoundError(`Skill with id ${id} not found`)
        }
        return deleted
    }
    catch(error){
        throw error
    }
}

