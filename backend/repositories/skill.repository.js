import Skill from "../models/skill.model.js";

export const findAllSkills = () => Skill.find()

export const findSkillById = (id) => Skill.findById(id)

export const createSkill = (data) => new Skill(data).save()

export const updateSkill = (id, data) => Skill.findByIdAndUpdate(id, data, { new: true })

export const deleteSkill = (id) => Skill.findByIdAndDelete(id)
