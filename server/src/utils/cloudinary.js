const cloudinary = require('cloudinary').v2

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  )
}

const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) {
    return false
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  return true
}

const uploadToCloudinary = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    if (!configureCloudinary()) {
      return reject(
        new Error(
          'Cloudinary is not properly configured. Missing required credentials.',
        ),
      )
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'vibematch/profiles',
        public_id: `profile-${userId}-${Date.now()}`,
        resource_type: 'image',
        transformation: [
          {
            width: 800,
            height: 800,
            crop: 'limit',
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }
        resolve(result)
      },
    )

    uploadStream.end(buffer)
  })
}

const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (
      !imageUrl ||
      typeof imageUrl !== 'string' ||
      !imageUrl.includes('res.cloudinary.com')
    ) {
      return null
    }

    if (!configureCloudinary()) {
      return null
    }

    // Extract public_id from Cloudinary URL:
    // Format: https://res.cloudinary.com/<cloud>/image/upload/(v<version>/)?<public_id>.<ext>
    const regex = /\/image\/upload\/(?:v\d+\/)?([^.]+)/
    const match = imageUrl.match(regex)

    if (match && match[1]) {
      const publicId = match[1]
      const result = await cloudinary.uploader.destroy(publicId)
      return result
    }

    return null
  } catch (error) {
    // Non-fatal cleanup log, do not throw
    console.error('Cloudinary asset cleanup error:', error.message)
    return null
  }
}

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
}
