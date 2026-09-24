const express = require('express')
const {
  getMusicProfile,
  updateMusicProfile,
  getSpotifyAuthUrl,
  spotifyCallback,
  syncSpotify,
  disconnectSpotify,
  demoConnectSpotify,
} = require('../controllers/music.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', protect, getMusicProfile)
router.put('/', protect, updateMusicProfile)

// Spotify OAuth & Integration
router.get('/spotify/login', protect, getSpotifyAuthUrl)
router.get('/spotify/callback', spotifyCallback)
router.post('/spotify/sync', protect, syncSpotify)
router.post('/spotify/disconnect', protect, disconnectSpotify)
router.post('/spotify/demo-connect', protect, demoConnectSpotify)

module.exports = router