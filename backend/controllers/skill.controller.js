import * as skillService from '../services/skill.service.js'

export const getAllSkills = async (req, res) => {
  try {
    const skills = await skillService.getAllSkills()
    res.status(200).json(skills)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get skills', error })
  }
}

export const getSkillById = async (req, res) => {
  try {
    const { id } = req.params

    const skill = await skillService.getSkillById(id)

    res.status(200).json(skill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get skill', error })
  }
}

export const createSkill = async (req, res) => {
  try {
    const skillData = req.body

    const newSKill= await skillService.createSkill(skillData)
    res.status(201).json(newSkill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create skill', error })
  }
}

export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params
    const skillData = req.body

    const updatedSkill = await skillService.updateSkill(id, skillData)
    res.status(200).json(updatedSkill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update skill', error })
  }
}

export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params

    const result = await skillService.deleteSkill(id)
    res.status(200).json({ message: 'Skill deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete skill', error })
  }
}