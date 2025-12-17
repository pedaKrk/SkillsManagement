import {futureSkillRepository} from '../repositories/future.skill.repository.js'
import {NotFoundError} from "../errors/not.found.error.js";
import FutureSkill from "../models/future.skill.model.js";


export const getAllFutureSkills = async () => {
    try{
        return await futureSkillRepository.findAllFutureSkills()
    }
    catch(error){
        throw error
    }
}

export const createFutureSkill = async (data) => {
    try{
        return await futureSkillRepository.createFutureSkill(data)
    }
    catch(error){
        throw error
    }
}

export const updateFutureSkill = async (id, data) => {
    const updated = await futureSkillRepository.updateFutureSkill(id, data)
    if(!updated){
        throw new NotFoundError(`Future skill with id ${id} not found`)
    }
}

export const deleteFutureSkill = async (id) => {
    try{
        const deleted = await futureSkillRepository.deleteFutureSkill(id)
        if(!deleted){
            throw new NotFoundError(`Future skill with id ${id} not found`)
        }
        return deleted
    }
    catch(error){
        throw error
    }
}

export const getFutureSkillById = async (id) => {
    const futureSkill = await futureSkillRepository.findFutureSkillById(id);

    if (!futureSkill) return null;

    // manual populate
    return await FutureSkill.populate(futureSkill, [
        { path: "skill_id" },
        { path: "lecturer_id" }
    ]);
};

