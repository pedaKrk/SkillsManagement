const Skill = require('../models/skillSchema')

exports.getAllSkills = async () => {
  return Skill.find()
}

exports.getSkillById = async (id) => {
  return Skill.findById(id)
}

exports.createSkill = async (skillData) => {
  const skill = new Skill(skillData)
  return skill.save()
}

exports.updateSkill = async (id, skillData) => {
  return Skill.findByIdAndUpdate(id, skillData, { new: true })
}

exports.deleteSkill = async (id) => {
  return Skill.findByIdAndDelete(id)
}