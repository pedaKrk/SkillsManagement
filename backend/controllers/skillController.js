const skillService = require('../services/skillService');

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await skillService.getAllSkills()
    res.status(200).json(skills)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get skills', error })
  }
}

exports.getSkillById = async (req, res) => {
  try {
    const skill = await skillService.getSkillById(req.params.id)
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' })
    }
    res.status(200).json(skill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get skill', error })
  }
}

exports.createSkill = async (req, res) => {
  try {
    const newSkill = await skillService.createSkill(req.body)
    res.status(201).json(newSkill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create skill', error })
  }
}

exports.updateSkill = async (req, res) => {
  try {
    const updatedSkill = await skillService.updateSkill(req.params.id, req.body)
    if (!updatedSkill) {
      return res.status(404).json({ message: 'Skill not found' })
    }
    res.status(200).json(updatedSkill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update skill', error })
  }
}

exports.deleteSkill = async (req, res) => {
  try {
    const result = await skillService.deleteSkill(req.params.id)
    if (!result) {
      return res.status(404).json({ message: 'Skill not found' })
    }
    res.status(200).json({ message: 'Skill deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete skill', error })
  }
}