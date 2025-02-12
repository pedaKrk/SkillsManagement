import Skill from "../models/skill.model.js";

export const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find()
    res.status(200).json(skills)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get skills', error })
  }
}

export const getSkillById = async (req, res) => {
  try {
    const { id } = req.params
    const skill = await Skill.findById(id)
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' })
    }
    res.status(200).json(skill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get skill', error })
  }
}

export const createSkill = async (req, res) => {
  try {
    const skillData = req.body

    const skill = new Skill(skillData)
    const newSkill = await skill.save()
    res.status(201).json(newSkill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create skill', error })
  }
}

export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params
    const skillData = req.body

    const updatedSkill = await Skill.findByIdAndUpdate(id, skillData, { new: true })
    if (!updatedSkill) {
      return res.status(404).json({ message: 'Skill not found' })
    }
    res.status(200).json(updatedSkill)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update skill', error })
  }
}

export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params

    const result = await Skill.findByIdAndDelete(id)
    if (!result) {
      return res.status(404).json({ message: 'Skill not found' })
    }
    res.status(200).json({ message: 'Skill deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete skill', error })
  }
}