import Skill from "../models/skill.model.js";

const getAllSkills = async () => {
    return Skill.find();
};

const getSkillById = async (id) => {
    return Skill.findById(id);
};

const createSkill = async (skillData) => {
    const skill = new Skill(skillData);
    return await skill.save();
};

const updateSkill = async (id, skillData) => {
    return Skill.findByIdAndUpdate(id, skillData, { new: true });
};

const deleteSkill = async (id) => {
    return Skill.findByIdAndDelete(id);
};

export const skillRepository = {
    getAllSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill,
};
