import express from 'express'
const router = express.Router()
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'

// Alle Routen sind geschützt
router.use(authenticateToken)

// Nur Admin darf alle User sehen
router.get('/', authorizeRole(['Admin']), getAllUsers)

// User dürfen ihre eigenen Daten sehen
router.get('/:id', getUserById)

// Nur Admin darf User erstellen
router.post('/', authorizeRole(['Admin']), createUser)

// User können nur ihre eigenen Daten ändern, Admin kann alle ändern
router.put('/:id', updateUser)

// Nur Admin darf User löschen
router.delete('/:id', authorizeRole(['Admin']), deleteUser)

export default router