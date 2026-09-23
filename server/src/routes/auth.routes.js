const express = require('express')

const {
  register,
  login,
  changePassword,
  deleteAccount,
} = require('../controllers/auth.controller')

const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.post(
  '/register',
  register,
)

router.post(
  '/login',
  login,
)

router.put(
  '/change-password',
  protect,
  changePassword,
)

router.delete(
  '/delete-account',
  protect,
  deleteAccount,
)

module.exports = router