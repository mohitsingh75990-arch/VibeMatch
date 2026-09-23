const multer = require('multer')
const path = require('path')

const uploadDirectory = path.join(
  __dirname,
  '../../uploads',
)

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Only JPG, PNG and WebP images are allowed.',
      ),
      false,
    )
  }
}

const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

module.exports = {
  uploadProfileImage,
  uploadDirectory,
}

