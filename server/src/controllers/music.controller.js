const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const MusicProfile = require('../models/MusicProfile')
const {
  encrypt,
  decrypt,
  isEncryptedFormat,
  migratePlaintextIfNeeded,
} = require('../utils/tokenEncryption')

const SPOTIFY_SCOPES = 'user-read-private user-top-read'

const deriveVibeTags = (genres = []) => {
  const vibes = new Set()
  const gStr = genres.join(' ').toLowerCase()
  if (/electronic|edm|dance|techno|house|party/i.test(gStr)) vibes.add('EDM')
  if (/indie|folk|acoustic|singer-songwriter/i.test(gStr)) vibes.add('Indie')
  if (/hip hop|rap|trap|r&b/i.test(gStr)) vibes.add('Late Night')
  if (/pop|rock|dance/i.test(gStr)) vibes.add('Energetic')
  if (/jazz|lo-fi|ambient|chill|soul/i.test(gStr)) vibes.add('Chill')
  return Array.from(vibes)
}

const getMusicProfile = async (req, res) => {
  try {
    const musicProfile = await MusicProfile.findOne({
      user: req.user.userId,
    })

    if (!musicProfile) {
      return res.status(200).json({
        success: true,
        musicProfile: {
          spotifyConnected: false,
          spotifyId: null,
          topArtists: [],
          topTracks: [],
          genres: [],
          favoriteArtists: [],
          favoriteSongs: [],
          vibeTags: [],
          lastSyncedAt: null,
        },
      })
    }

    return res.status(200).json({
      success: true,
      musicProfile,
    })
  } catch (error) {
    console.error('Get music profile error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch music profile',
    })
  }
}

const updateMusicProfile = async (req, res) => {
  try {
    const {
      topArtists,
      topTracks,
      genres,
      favoriteArtists,
      favoriteSongs,
      vibeTags,
    } = req.body

    const musicProfile = await MusicProfile.findOneAndUpdate(
      {
        user: req.user.userId,
      },
      {
        user: req.user.userId,
        topArtists: topArtists || [],
        topTracks: topTracks || [],
        genres: genres || [],
        favoriteArtists: favoriteArtists || [],
        favoriteSongs: favoriteSongs || [],
        vibeTags: vibeTags || [],
        lastSyncedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    )

    return res.status(200).json({
      success: true,
      message: 'Music profile updated successfully',
      musicProfile,
    })
  } catch (error) {
    console.error('Update music profile error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to update music profile',
    })
  }
}

/*
  GET /api/music/spotify/login
  Generate Spotify OAuth Authorization URL with state token
*/
const getSpotifyAuthUrl = async (req, res) => {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID

    if (!clientId) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: 'Spotify API credentials are not configured on server',
      })
    }

    const redirectUri =
      process.env.SPOTIFY_REDIRECT_URI ||
      `${req.protocol}://${req.get('host')}/api/music/spotify/callback`

    const state = jwt.sign(
      {
        userId: req.user.userId,
        nonce: crypto.randomBytes(16).toString('hex'),
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    )

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SPOTIFY_SCOPES,
      redirect_uri: redirectUri,
      state,
      show_dialog: 'true',
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    return res.status(200).json({
      success: true,
      configured: true,
      url: authUrl,
    })
  } catch (error) {
    console.error('Spotify auth URL error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to initialize Spotify login',
    })
  }
}

/*
  GET /api/music/spotify/callback
  Exchange authorization code for Spotify tokens & sync profile
*/
const spotifyCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

  try {
    const { code, state, error } = req.query

    if (error || !code || !state) {
      return res.redirect(`${clientUrl}/profile?spotify=denied`)
    }

    let decoded
    try {
      decoded = jwt.verify(
        state,
        process.env.JWT_SECRET,
      )
    } catch {
      return res.redirect(`${clientUrl}/profile?spotify=invalid_state`)
    }

    const userId = decoded.userId
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri =
      process.env.SPOTIFY_REDIRECT_URI ||
      `${req.protocol}://${req.get('host')}/api/music/spotify/callback`

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      console.error('Spotify token exchange failed:', await tokenRes.text())
      return res.redirect(`${clientUrl}/profile?spotify=token_failed`)
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in || 3600

    // Fetch Spotify profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profileData = profileRes.ok ? await profileRes.json() : {}

    // Fetch top artists (limit 10)
    const artistsRes = await fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    const artistsData = artistsRes.ok ? await artistsRes.json() : { items: [] }

    // Fetch top tracks (limit 10)
    const tracksRes = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    const tracksData = tracksRes.ok ? await tracksRes.json() : { items: [] }

    const topArtists = (artistsData.items || []).map((a) => a.name).filter(Boolean)
    const genres = Array.from(
      new Set(
        (artistsData.items || []).flatMap((a) => a.genres || []).filter(Boolean),
      ),
    ).slice(0, 10)
    const topTracks = (tracksData.items || []).map((t) => {
      const artist = t.artists?.[0]?.name ? ` - ${t.artists[0].name}` : ''
      return `${t.name}${artist}`
    }).filter(Boolean)

    const derivedVibes = deriveVibeTags(genres)

    const musicProfile = await MusicProfile.findOne({ user: userId })
    const existingVibes = musicProfile?.vibeTags || []
    const mergedVibes = Array.from(new Set([...existingVibes, ...derivedVibes]))

    await MusicProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        spotifyConnected: true,
        spotifyId: profileData.id || null,
        spotifyAccessToken: encrypt(accessToken),
        spotifyRefreshToken: refreshToken ? encrypt(refreshToken) : undefined,
        spotifyTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        topArtists,
        topTracks,
        genres,
        vibeTags: mergedVibes,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true },
    )

    return res.redirect(`${clientUrl}/profile?spotify=connected`)
  } catch (error) {
    console.error('Spotify callback error:', error.message)
    return res.redirect(`${clientUrl}/profile?spotify=error`)
  }
}

/*
  POST /api/music/spotify/sync
  Refresh Spotify tokens if needed and re-fetch top tracks/artists
*/
const syncSpotify = async (req, res) => {
  try {
    const musicProfile = await MusicProfile.findOne({
      user: req.user.userId,
    }).select('+spotifyAccessToken +spotifyRefreshToken +spotifyTokenExpiresAt')

    if (!musicProfile || !musicProfile.spotifyConnected) {
      return res.status(400).json({
        success: false,
        message: 'Spotify is not connected to this account',
      })
    }

    let accessToken = decrypt(musicProfile.spotifyAccessToken)
    const expiresAt = musicProfile.spotifyTokenExpiresAt
    const refreshToken = decrypt(musicProfile.spotifyRefreshToken)

    let tokenRefreshed = false

    // If token is expiring in < 60 seconds and refresh token is present, refresh it
    if (
      refreshToken &&
      (!expiresAt || expiresAt.getTime() - Date.now() < 60000)
    ) {
      const clientId = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

      if (clientId && clientSecret) {
        const refreshRes = await fetch(
          'https://accounts.spotify.com/api/token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization:
                'Basic ' +
                Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
          },
        )

        if (refreshRes.ok) {
          const refreshed = await refreshRes.json()
          accessToken = refreshed.access_token
          musicProfile.spotifyAccessToken = encrypt(accessToken)
          if (refreshed.refresh_token) {
            musicProfile.spotifyRefreshToken = encrypt(refreshed.refresh_token)
          }
          if (refreshed.expires_in) {
            musicProfile.spotifyTokenExpiresAt = new Date(
              Date.now() + refreshed.expires_in * 1000,
            )
          }
          tokenRefreshed = true
        }
      }
    }

    if (accessToken) {
      const [artistsRes, tracksRes] = await Promise.all([
        fetch(
          'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ).catch(() => null),
        fetch(
          'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ).catch(() => null),
      ])

      if (artistsRes && artistsRes.ok) {
        const artistsData = await artistsRes.json()
        musicProfile.topArtists = (artistsData.items || [])
          .map((a) => a.name)
          .filter(Boolean)
        const newGenres = Array.from(
          new Set(
            (artistsData.items || []).flatMap((a) => a.genres || []).filter(Boolean),
          ),
        ).slice(0, 10)
        if (newGenres.length > 0) {
          musicProfile.genres = newGenres
          const derived = deriveVibeTags(newGenres)
          musicProfile.vibeTags = Array.from(
            new Set([...(musicProfile.vibeTags || []), ...derived]),
          )
        }
      }

      if (tracksRes && tracksRes.ok) {
        const tracksData = await tracksRes.json()
        musicProfile.topTracks = (tracksData.items || [])
          .map((t) => {
            const artist = t.artists?.[0]?.name ? ` - ${t.artists[0].name}` : ''
            return `${t.name}${artist}`
          })
          .filter(Boolean)
      }
    }

    musicProfile.lastSyncedAt = new Date()

    if (!tokenRefreshed && musicProfile.isModified('spotifyAccessToken')) {
      musicProfile.spotifyAccessToken = encrypt(decrypt(musicProfile.spotifyAccessToken))
    }
    if (!tokenRefreshed && musicProfile.isModified('spotifyRefreshToken') && musicProfile.spotifyRefreshToken) {
      musicProfile.spotifyRefreshToken = encrypt(decrypt(musicProfile.spotifyRefreshToken))
    }

    await musicProfile.save()

    const sanitizedProfile = musicProfile.toObject()
    delete sanitizedProfile.spotifyAccessToken
    delete sanitizedProfile.spotifyRefreshToken
    delete sanitizedProfile.spotifyTokenExpiresAt

    return res.status(200).json({
      success: true,
      message: 'Spotify music profile synced successfully',
      musicProfile: sanitizedProfile,
    })
  } catch (error) {
    console.error('Spotify sync error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to sync Spotify data',
    })
  }
}

/*
  POST /api/music/spotify/disconnect
  Unlink Spotify account and revoke stored tokens
*/
const disconnectSpotify = async (req, res) => {
  try {
    const musicProfile = await MusicProfile.findOne({
      user: req.user.userId,
    })

    if (musicProfile) {
      musicProfile.spotifyConnected = false
      musicProfile.spotifyId = null
      musicProfile.spotifyAccessToken = null
      musicProfile.spotifyRefreshToken = null
      musicProfile.spotifyTokenExpiresAt = null
      await musicProfile.save()
    }

    return res.status(200).json({
      success: true,
      message: 'Spotify disconnected successfully',
    })
  } catch (error) {
    console.error('Spotify disconnect error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to disconnect Spotify',
    })
  }
}

/*
  POST /api/music/spotify/demo-connect
  Safe simulation for development/testing when live Spotify credentials are not set
*/
const demoConnectSpotify = async (req, res) => {
  try {
    const demoArtists = [
      'The Weeknd',
      'Dua Lipa',
      'Kendrick Lamar',
      'Arctic Monkeys',
      'Billie Eilish',
      'Arijit Singh',
    ]
    const demoTracks = [
      'Blinding Lights - The Weeknd',
      'Levitating - Dua Lipa',
      'HUMBLE. - Kendrick Lamar',
      'Do I Wanna Know? - Arctic Monkeys',
    ]
    const demoGenres = ['pop', 'indie pop', 'synthpop', 'hip hop', 'alternative rock']
    const derivedVibes = deriveVibeTags(demoGenres)

    const musicProfile = await MusicProfile.findOneAndUpdate(
      { user: req.user.userId },
      {
        user: req.user.userId,
        spotifyConnected: true,
        spotifyId: 'spotify_user_demo',
        topArtists: demoArtists,
        topTracks: demoTracks,
        genres: demoGenres,
        vibeTags: derivedVibes,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true },
    )

    return res.status(200).json({
      success: true,
      message: 'Demo Spotify account linked successfully',
      musicProfile,
    })
  } catch (error) {
    console.error('Demo Spotify connect error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to connect demo Spotify account',
    })
  }
}

module.exports = {
  getMusicProfile,
  updateMusicProfile,
  getSpotifyAuthUrl,
  spotifyCallback,
  syncSpotify,
  disconnectSpotify,
  demoConnectSpotify,
}