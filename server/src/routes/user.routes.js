const express = require('express')

const {
  getProfile,
  getUserById,
  updateProfile,
  uploadProfileImage,
  getPreferences,
  updatePreferences,
  discoverUsers,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  setPrimaryPhoto,
  reorderGalleryPhotos,
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

router.post(
  '/me/photos',
  protect,
  uploadProfileImageMiddleware.single('photo'),
  uploadGalleryPhoto,
)

router.delete(
  '/me/photos/:photoId',
  protect,
  deleteGalleryPhoto,
)

router.put(
  '/me/photos/reorder',
  protect,
  reorderGalleryPhotos,
)

router.put(
  '/me/photos/:photoId/primary',
  protect,
  setPrimaryPhoto,
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