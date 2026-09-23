const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')
const Block = require('../models/Block')

/*
  Helper: Extract unique common items between two arrays (case-insensitive)
*/
const getCommonItems = (listA = [], listB = []) => {
  if (!Array.isArray(listA) || !Array.isArray(listB)) {
    return []
  }

  const setB = new Set(
    listB
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean),
  )

  const common = []
  const seen = new Set()

  for (const item of listA) {
    const normalized = String(item).trim().toLowerCase()
    if (normalized && setB.has(normalized) && !seen.has(normalized)) {
      seen.add(normalized)
      common.push(String(item).trim())
    }
  }

  return common
}

/*
  Collect all music items for a user combining User profile and MusicProfile
*/
const collectUserMusicData = (user, musicProfile) => {
  const artists = [
    ...(user.favoriteArtists || []),
    ...(musicProfile?.favoriteArtists || []),
    ...(musicProfile?.topArtists || []),
  ]

  const genres = [
    ...(user.favoriteGenres || []),
    ...(musicProfile?.genres || []),
  ]

  const songs = [
    ...(user.favoriteSongs || []),
    ...(musicProfile?.favoriteSongs || []),
    ...(musicProfile?.topTracks || []),
  ]

  const vibes = [
    ...(musicProfile?.vibeTags || []),
  ]

  const interests = [...(user.interests || [])]

  return { artists, genres, songs, vibes, interests }
}

/*
  Native Heuristic Vibe & Match Explanation Engine
*/
const generateHeuristicExplanation = (
  currentUserName,
  targetUserName,
  commonArtists,
  commonGenres,
  commonInterests,
  commonVibes,
  commonSongs,
) => {
  // 1. Determine Title / Summary
  let summary = 'Vibe Explorers ✨'
  if (commonArtists.length > 0 && commonVibes.length > 0) {
    summary = 'Harmonic Resonance 🎵'
  } else if (commonArtists.length > 0) {
    summary = 'Sonic Soulmates 🎧'
  } else if (commonGenres.length > 0) {
    summary = 'Shared Rhythm & Groove 🎶'
  } else if (commonInterests.length > 0) {
    summary = 'Kindred Spirits 💫'
  } else if (commonVibes.length > 0) {
    summary = 'Complementary Energy ⚡'
  }

  // 2. Generate detailed explanation paragraphs
  const explanationParts = []

  if (commonArtists.length > 0) {
    explanationParts.push(
      `You both share a deep appreciation for ${commonArtists.slice(0, 3).join(', ')}, showing an aligned musical wavelength.`,
    )
  }

  if (commonGenres.length > 0) {
    explanationParts.push(
      `Your taste connects through ${commonGenres.slice(0, 3).join(' and ')} sounds.`,
    )
  }

  if (commonVibes.length > 0) {
    explanationParts.push(
      `Your energy profiles match with mutual vibe tags: "${commonVibes.slice(0, 3).join('", "')}".`,
    )
  }

  if (commonInterests.length > 0) {
    explanationParts.push(
      `Beyond music, you both enjoy ${commonInterests.slice(0, 3).join(', ')}.`,
    )
  }

  if (commonSongs.length > 0) {
    explanationParts.push(
      `You both marked favorite tracks including "${commonSongs[0]}".`,
    )
  }

  if (explanationParts.length === 0) {
    explanationParts.push(
      `${targetUserName} and you bring unique musical tastes to the table, creating an exciting opportunity to explore new artists, sounds, and shared experiences together.`,
    )
  }

  const explanation = explanationParts.join(' ')

  // 3. Generate a personalized date / connection idea
  let dateIdea =
    'Plan a cozy coffee hangout and trade your current top 3 favorite songs with each other.'

  if (commonArtists.length > 0) {
    dateIdea = `Grab coffee or drinks and listen to ${commonArtists[0]}'s greatest tracks, or check out upcoming local gigs together.`
  } else if (commonGenres.length > 0) {
    dateIdea = `Find an intimate local lounge or acoustic session that spins ${commonGenres[0]} tunes and vibe together.`
  } else if (commonInterests.length > 0) {
    dateIdea = `Plan an afternoon around ${commonInterests[0]} followed by a casual drive listening to each other's favorite playlists.`
  }

  return {
    summary,
    explanation,
    dateIdea,
  }
}

/*
  Generate 3 contextual conversation icebreakers
*/
const generateHeuristicIcebreakers = (
  targetUserName,
  targetData,
  commonArtists,
  commonGenres,
  commonInterests,
  commonVibes,
  commonSongs,
) => {
  const icebreakers = []

  // Icebreaker 1: Music focused
  if (commonArtists.length > 0) {
    icebreakers.push(
      `Hey ${targetUserName}! I saw we both listen to ${commonArtists[0]} — what's your all-time favorite track by them?`,
    )
  } else if (commonSongs.length > 0) {
    icebreakers.push(
      `Hey ${targetUserName}! Love that you like "${commonSongs[0]}". What first got you into it?`,
    )
  } else if (commonGenres.length > 0) {
    icebreakers.push(
      `Hey ${targetUserName}! Since we both enjoy ${commonGenres[0]}, who's an underrated artist in that genre you think I should hear?`,
    )
  } else if (targetData.artists.length > 0) {
    icebreakers.push(
      `Hey ${targetUserName}! I noticed you like ${targetData.artists[0]}. What song should I listen to first to get into them?`,
    )
  } else {
    icebreakers.push(
      `Hey ${targetUserName}! If we had a 3-hour road trip, what would be the very first song you'd put on?`,
    )
  }

  // Icebreaker 2: Interest / Lifestyle focused
  if (commonInterests.length > 0) {
    icebreakers.push(
      `I noticed you're into ${commonInterests[0]} too! What's your favorite thing about it?`,
    )
  } else if (targetData.interests.length > 0) {
    icebreakers.push(
      `Hey! I saw ${targetData.interests[0]} on your profile. How long have you been passionate about it?`,
    )
  } else {
    icebreakers.push(
      `Are you more of a late-night music listener with headphones, or a weekend concert person?`,
    )
  }

  // Icebreaker 3: Vibe / Date suggestion
  if (commonVibes.length > 0) {
    icebreakers.push(
      `Our vibe tags match on "${commonVibes[0]}"! What kind of music gives you that exact energy?`,
    )
  } else {
    icebreakers.push(
      `Quick question: Coffee shop acoustic session or late-night indie road trip? Which vibe are you choosing?`,
    )
  }

  return icebreakers.slice(0, 3)
}

/*
  Optional: Call Gemini Generative Language API if GEMINI_API_KEY is configured
*/
const tryGeminiExplanation = async (
  currentUserName,
  targetUserName,
  commonArtists,
  commonGenres,
  commonInterests,
  commonVibes,
) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const prompt = `You are VibeMatch AI, an AI dating and music compatibility assistant.
Analyze the compatibility between ${currentUserName} and ${targetUserName}:
- Common Artists: ${commonArtists.join(', ') || 'None directly overlapping'}
- Common Genres: ${commonGenres.join(', ') || 'None directly overlapping'}
- Common Interests: ${commonInterests.join(', ') || 'None directly overlapping'}
- Common Vibes: ${commonVibes.join(', ') || 'None directly overlapping'}

Return ONLY a valid JSON object with these exact keys:
{
  "summary": "Short 2-4 word punchy vibe title with an emoji",
  "explanation": "2-3 sentences explaining why they connect and what their shared vibe feels like.",
  "dateIdea": "1 creative music/interest-based first hangout idea."
}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const rawText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!rawText) {
      return null
    }

    const parsed = JSON.parse(rawText)
    if (parsed.summary && parsed.explanation && parsed.dateIdea) {
      return {
        summary: String(parsed.summary).slice(0, 100),
        explanation: String(parsed.explanation).slice(0, 600),
        dateIdea: String(parsed.dateIdea).slice(0, 300),
      }
    }
  } catch {
    // Graceful fallback to heuristic engine
    return null
  }

  return null
}

/*
  GET /api/ai/match-explanation/:userId
*/
const getMatchExplanation = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { userId: targetUserId } = req.params

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required',
      })
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot generate AI insights for yourself',
      })
    }

    // Check if either user has blocked the other
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blocked: targetUserId },
        { blocker: targetUserId, blocked: currentUserId },
      ],
    })

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: user is unavailable',
      })
    }

    const [currentUser, targetUser, currentMusic, targetMusic] =
      await Promise.all([
        User.findById(currentUserId).select(
          'name interests favoriteArtists favoriteGenres favoriteSongs',
        ),
        User.findById(targetUserId).select(
          'name profileImage age location interests favoriteArtists favoriteGenres favoriteSongs',
        ),
        MusicProfile.findOne({ user: currentUserId }),
        MusicProfile.findOne({ user: targetUserId }),
      ])

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      })
    }

    const myData = collectUserMusicData(currentUser, currentMusic)
    const targetData = collectUserMusicData(targetUser, targetMusic)

    const commonArtists = getCommonItems(myData.artists, targetData.artists)
    const commonGenres = getCommonItems(myData.genres, targetData.genres)
    const commonInterests = getCommonItems(
      myData.interests,
      targetData.interests,
    )
    const commonVibes = getCommonItems(myData.vibes, targetData.vibes)
    const commonSongs = getCommonItems(myData.songs, targetData.songs)

    // Try Gemini if configured, otherwise use heuristic vibe engine
    const geminiResult = await tryGeminiExplanation(
      currentUser.name,
      targetUser.name,
      commonArtists,
      commonGenres,
      commonInterests,
      commonVibes,
    )

    const finalInsight =
      geminiResult ||
      generateHeuristicExplanation(
        currentUser.name,
        targetUser.name,
        commonArtists,
        commonGenres,
        commonInterests,
        commonVibes,
        commonSongs,
      )

    return res.status(200).json({
      success: true,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        profileImage: targetUser.profileImage || null,
        age: targetUser.age || null,
        location: targetUser.location || null,
      },
      summary: finalInsight.summary,
      explanation: finalInsight.explanation,
      dateIdea: finalInsight.dateIdea,
      sharedHighlights: {
        artists: commonArtists,
        genres: commonGenres,
        interests: commonInterests,
        vibes: commonVibes,
        songs: commonSongs,
      },
    })
  } catch (error) {
    console.error('AI match explanation error:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to generate match explanation',
    })
  }
}

/*
  GET /api/ai/icebreakers/:userId
*/
const getConversationStarters = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { userId: targetUserId } = req.params

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required',
      })
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot generate icebreakers for yourself',
      })
    }

    // Check if either user has blocked the other
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blocked: targetUserId },
        { blocker: targetUserId, blocked: currentUserId },
      ],
    })

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: user is unavailable',
      })
    }

    const [currentUser, targetUser, currentMusic, targetMusic] =
      await Promise.all([
        User.findById(currentUserId).select(
          'name interests favoriteArtists favoriteGenres favoriteSongs',
        ),
        User.findById(targetUserId).select(
          'name interests favoriteArtists favoriteGenres favoriteSongs',
        ),
        MusicProfile.findOne({ user: currentUserId }),
        MusicProfile.findOne({ user: targetUserId }),
      ])

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      })
    }

    const myData = collectUserMusicData(currentUser, currentMusic)
    const targetData = collectUserMusicData(targetUser, targetMusic)

    const commonArtists = getCommonItems(myData.artists, targetData.artists)
    const commonGenres = getCommonItems(myData.genres, targetData.genres)
    const commonInterests = getCommonItems(
      myData.interests,
      targetData.interests,
    )
    const commonVibes = getCommonItems(myData.vibes, targetData.vibes)
    const commonSongs = getCommonItems(myData.songs, targetData.songs)

    const icebreakers = generateHeuristicIcebreakers(
      targetUser.name,
      targetData,
      commonArtists,
      commonGenres,
      commonInterests,
      commonVibes,
      commonSongs,
    )

    return res.status(200).json({
      success: true,
      icebreakers,
    })
  } catch (error) {
    console.error('AI icebreakers error:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to generate icebreakers',
    })
  }
}

module.exports = {
  getMatchExplanation,
  getConversationStarters,
}
