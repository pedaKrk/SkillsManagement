import * as skillService from '../services/skill.service.js'
import * as futureSkillService from "../services/future.skill.service.js";
import Skill from '../models/skill.model.js';
import FutureSkill from '../models/future.skill.model.js';
import User from '../models/user.model.js';

import { skillService } from '../services/skill.service.js'
import SkillRepository from "../repositories/skill.repository.js";

export const getAllSkills = async (req, res) => {
  try {
    console.info("Get all skills");
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

    const newSkill= await skillService.createSkill(skillData)
    res.status(201).json(newSkill)
  } catch (error) {
    console.error('Error creating skill:', error);
    
    // Check if it's a duplicate name error
    if (error.message && error.message.includes('already exists')) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Failed to create skill', error: error.message })
    }
  }
}

export const updateSkill = async (req, res) => {
  const { id } = req.params
  
  try {
    const skillData = req.body

    console.log(`Updating skill ${id} with data:`, skillData)
    
    // Get the skill before update to see current state
    const skillBefore = await skillService.getSkillById(id)
    console.log(`Skill ${id} before update:`, {
      name: skillBefore.name,
      children: skillBefore.children,
      parent_id: skillBefore.parent_id
    })
    
    const updatedSkill = await skillService.updateSkill(id, skillData)
    console.log(`Skill ${id} updated successfully:`, {
      name: updatedSkill.name,
      children: updatedSkill.children,
      parent_id: updatedSkill.parent_id
    })
    
    res.status(200).json(updatedSkill)
  } catch (error) {
    console.error(`Error updating skill ${id}:`, error)
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
export const addFutureSkillToSkills = async (req, res) => {
  try {
    const { futureSkillId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId in request" });
    }

    // Load future skill
    let futureSkill = await futureSkillService.getFutureSkillById(futureSkillId);
    if (!futureSkill) {
      return res.status(404).json({ message: "Future skill not found" });
    }

    const skillName = futureSkill.skill_id?.name;
    if (!skillName) {
      return res.status(400).json({ message: "Future skill has no skill name" });
    }

    // Check if skill already exists in Skills collection
    let existingSkill = await Skill.findOne({ name: skillName });

    if (!existingSkill) {
      existingSkill = await Skill.create({
        name: skillName
      });
    }

    // Build new user skill entry
    const newUserSkill = {
      skill: existingSkill._id,
      levelHistory: [
        {
          level: futureSkill.future_achievable_level || "Beginner",
          changedAt: new Date(),
          changedBy: userId
        }
      ]
    };

    // Add new skill entry only if not already present
    await User.findByIdAndUpdate(
        userId,
        { $addToSet: { skills: newUserSkill } },
        { new: true }
    );

    // Remove future skill after adding
    await futureSkillService.deleteFutureSkill(futureSkillId);

    return res.status(200).json({
      message: "Future skill added to user's skills",
      skill: newUserSkill
    });

  } catch (error) {
    console.error("Error converting future skill:", error);
    return res.status(500).json({
      message: "Failed to convert future skill",
      error: error.message
    });
  }
};


export const getRootSkills = async (req, res) => {
    try{
        console.log("getting root skills")
        const result = await skillService.getRootSkills()
        console.log(result)
        res.status(200).json(result)
    } catch (error){
        console.error('Error getting root skills', error)
        res.status(500).json({ message: 'Failed to get root skills', error })
    }
}