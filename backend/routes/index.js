const express = require('express')
const userRoutes = require('./users')
//const skillRoutes = require('./skills')

const router = express.Router()

router.use('/users', userRoutes)
//router.use('/skills', skillRoutes)

module.exports = router