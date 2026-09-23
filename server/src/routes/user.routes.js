const express = require('express')

const {
  getProfile,
  getUserById,
  updateProfile,
  uploadProfileImage,
  getPreferences,
  updatePreferences,
  discoverUsers,
} = require('../controllers/user.controller')

const protect = require('../middleware/auth.middleware')

const {
  uploadProfileImage: uploadProfileImageMiddleware,
} = require('../middleware/upload.middleware')

const router = express.Router()

router.get('/me', protect, getProfile)

router.put('/me', protect, updateProfile)

router.get(
  '/me/preferences',
  protect,
  getPreferences,
)

router.put(
  '/me/preferences',
  protect,
  updatePreferences,
)

router.post(
  '/me/profile-image',
  protect,
  uploadProfileImageMiddleware.single(
    'profileImage',
  ),
  uploadProfileImage,
)

router.get(
  '/discover',
  protect,
  discoverUsers,
)

router.get(
  '/:userId',
  protect,
  getUserById,
)

module.exports = router