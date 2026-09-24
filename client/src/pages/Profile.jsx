import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/errors'

/* ─── Profile Completeness Bar ─────────────────────────────────────────── */
function ProfileCompletenessBar({ profile, form, musicForm }) {
  const steps = [
    { label: 'Name', done: Boolean(form.name?.trim()) },
    { label: 'Age', done: Boolean(form.age) },
    { label: 'Gender', done: Boolean(form.gender) },
    { label: 'Location', done: Boolean(form.location?.trim()) },
    { label: 'Bio', done: form.bio?.trim().length >= 20 },
    {
      label: 'Photo',
      done:
        Boolean(profile?.profileImage) ||
        (Array.isArray(profile?.photos) && profile.photos.length > 0),
    },
    {
      label: 'Interests',
      done:
        (form.interests?.split(',').filter(Boolean).length || 0) >= 1,
    },
    {
      label: 'Music',
      done:
        Boolean(musicForm?.favoriteArtists?.trim()) ||
        Boolean(musicForm?.favoriteGenres?.trim()),
    },
    {
      label: 'Vibe',
      done: Array.isArray(musicForm?.vibeTags) && musicForm.vibeTags.length > 0,
    },
  ]

  const done = steps.filter((s) => s.done).length
  const pct = Math.round((done / steps.length) * 100)

  const color =
    pct === 100
      ? 'bg-emerald-500'
      : pct >= 66
      ? 'bg-fuchsia-500'
      : pct >= 33
      ? 'bg-amber-500'
      : 'bg-rose-500'

  const label =
    pct === 100
      ? '✨ Profile complete!'
      : pct >= 66
      ? 'Looking good — almost there'
      : pct >= 33
      ? 'Add more details to stand out'
      : 'Just getting started'

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:mb-6 sm:rounded-3xl sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            Profile completeness
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{label}</p>
        </div>
        <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-3 py-1.5 text-sm font-bold text-fuchsia-300">
          {pct}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {steps.map((step) => (
          <span
            key={step.label}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              step.done
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-white/5 text-slate-500'
            }`}
          >
            {step.done ? '✓' : '○'} {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── Profile Preview Card ──────────────────────────────────────────────── */
function ProfilePreviewCard({
  profile,
  form,
  musicForm,
  getImageUrl,
  spotifyConnected,
}) {
  const photos =
    Array.isArray(profile?.photos) && profile.photos.length > 0
      ? [...profile.photos].sort((a, b) => (a.order || 0) - (b.order || 0))
      : profile?.profileImage
      ? [{ url: profile.profileImage, isPrimary: true }]
      : []

  const primaryPhoto =
    photos.find((p) => p.isPrimary) || photos[0]
  const photoUrl = primaryPhoto ? getImageUrl(primaryPhoto.url) : ''

  const interests = (form.interests || '')
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean)
    .slice(0, 6)

  const genres = (form.favoriteGenres || '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 4)

  const artists = (form.favoriteArtists || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 4)

  const vibeTags = Array.isArray(musicForm?.vibeTags)
    ? musicForm.vibeTags.slice(0, 5)
    : []

  const hasContent =
    form.name || photoUrl || form.bio || interests.length > 0 || genres.length > 0

  if (!hasContent) return null

  return (
    <div className="mb-5 sm:mb-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-400 sm:text-sm">
        Your Vibe Card
      </p>
      <p className="mb-3 text-xs text-slate-500">
        This is how your profile appears to others when discovering.
      </p>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl sm:rounded-3xl">
        {/* Photo */}
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-violet-100 to-pink-100 sm:h-64">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={form.name || 'Profile'}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-7xl">💜</span>
            </div>
          )}

          {photos.length > 1 && (
            <div className="absolute top-2 inset-x-2 flex gap-1">
              {photos.map((p, idx) => (
                <div
                  key={p._id || idx}
                  className={`h-1 flex-1 rounded-full ${
                    idx === 0 ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-white">
                {form.name || 'Your name'}
                {form.age ? `, ${form.age}` : ''}
              </h3>
              {spotifyConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-xs">
                  🎧 Spotify
                </span>
              )}
            </div>
            {form.location && (
              <p className="text-xs text-white/80 mt-0.5">
                📍 {form.location}
              </p>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 sm:p-5">
          {form.bio && (
            <p className="text-sm leading-6 text-slate-700 mb-4">
              {form.bio.slice(0, 120)}
              {form.bio.length > 120 ? '…' : ''}
            </p>
          )}

          {interests.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {vibeTags.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vibe
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vibeTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {genres.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Music Genres
              </p>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700"
                  >
                    🎵 {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {artists.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Favorite Artists
              </p>
              <div className="flex flex-wrap gap-1.5">
                {artists.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                  >
                    🎤 {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const VIBE_TAGS = [
  'Romantic',
  'Chill',
  'Party',
  'Late Night',
  'Energetic',
  'Sad',
  'Happy',
  'Relaxed',
  'Adventurous',
  'Nostalgic',
  'Dreamy',
  'Feel Good',
]

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const API_ORIGIN = API_BASE_URL.replace(
  /\/api\/?$/,
  '',
)

function Profile() {
  const { user, login, token } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [musicSaving, setMusicSaving] = useState(false)
  const [musicSuccess, setMusicSuccess] = useState('')

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageSuccess, setImageSuccess] = useState('')
  const [musicProfile, setMusicProfile] = useState(null)
  const [spotifyActionLoading, setSpotifyActionLoading] = useState(false)
  const [spotifyMessage, setSpotifyMessage] = useState('')

  const [preferencesSaving, setPreferencesSaving] =
    useState(false)

  const [preferencesSuccess, setPreferencesSuccess] =
    useState('')

  const [preferences, setPreferences] = useState({
    interestedIn: [],
    minAge: 18,
    maxAge: 100,
    minVibeScore: 0,
    showSimilarMusic: true,
  })

  const loadingRef = useRef(false)

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    bio: '',
    location: '',
    profileImage: '',
    interests: '',
    favoriteArtists: '',
    favoriteGenres: '',
    favoriteSongs: '',
    vibeTags: [],
  })

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return ''
    }

    if (
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://')
    ) {
      return imagePath
    }

    return `${API_ORIGIN}${imagePath}`
  }

  const loadProfile = async () => {
    // Prevent duplicate/overlapping requests while one is pending.
    if (loadingRef.current) {
      return
    }

    loadingRef.current = true

    try {
      setLoading(true)
      setError('')

      const response = await api.get('/users/me')

      let musicData = {}

      try {
        const musicResponse = await api.get('/music')
        musicData =
          musicResponse.data.musicProfile || {}
      } catch {
        musicData = {}
      }

      let preferencesData = {}

      try {
        const preferencesResponse =
          await api.get('/users/me/preferences')

        preferencesData =
          preferencesResponse.data.preferences || {}
      } catch {
        preferencesData = {}
      }

      const data = response.data.user

      setProfile(data)

      setForm({
        name: data.name || '',
        age: data.age || '',
        gender: data.gender || '',
        bio: data.bio || '',
        location: data.location || '',
        profileImage: data.profileImage || '',
        interests:
          data.interests?.join(', ') || '',

        favoriteArtists:
          musicData.favoriteArtists?.join(', ') ||
          data.favoriteArtists?.join(', ') ||
          '',

        favoriteGenres:
          musicData.genres?.join(', ') ||
          data.favoriteGenres?.join(', ') ||
          '',

        favoriteSongs:
          musicData.favoriteSongs?.join(', ') ||
          data.favoriteSongs?.join(', ') ||
          '',

        vibeTags: musicData.vibeTags || [],
      })

      setPreferences({
        interestedIn:
          preferencesData.interestedIn || [],
        minAge:
          preferencesData.minAge ?? 18,
        maxAge:
          preferencesData.maxAge ?? 100,
        minVibeScore:
          preferencesData.minVibeScore ?? 0,
        showSimilarMusic:
          preferencesData.showSimilarMusic ?? true,
      })

      setMusicProfile(musicData)

      if (data.profileImage) {
        setImagePreview(
          getImageUrl(data.profileImage),
        )
      }
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          'Unable to load your profile.',
        ),
      )
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()

    const params = new URLSearchParams(window.location.search)
    const spotifyStatus = params.get('spotify')
    if (spotifyStatus === 'connected') {
      setSpotifyMessage(
        'Spotify account connected and music profile synced successfully! 🎧',
      )
    } else if (spotifyStatus === 'denied') {
      setError('Spotify connection was cancelled or denied.')
    } else if (spotifyStatus === 'error') {
      setError('An error occurred while connecting your Spotify account.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnectSpotify = async () => {
    if (spotifyActionLoading) {
      return
    }

    try {
      setSpotifyActionLoading(true)
      setError('')
      setSpotifyMessage('')

      const res = await api.get('/music/spotify/login')
      if (res.data?.configured && res.data?.url) {
        window.location.href = res.data.url
      } else {
        const demoRes = await api.post('/music/spotify/demo-connect')
        if (demoRes.data?.success) {
          setMusicProfile(demoRes.data.musicProfile)
          setSpotifyMessage(
            'Spotify music library linked! Top artists, tracks & genres synced.',
          )
          setForm((prev) => ({
            ...prev,
            favoriteArtists:
              prev.favoriteArtists ||
              demoRes.data.musicProfile.topArtists?.join(', ') ||
              '',
            favoriteGenres:
              prev.favoriteGenres ||
              demoRes.data.musicProfile.genres?.join(', ') ||
              '',
            vibeTags: Array.from(
              new Set([
                ...prev.vibeTags,
                ...(demoRes.data.musicProfile.vibeTags || []),
              ]),
            ),
          }))
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to connect to Spotify'))
    } finally {
      setSpotifyActionLoading(false)
    }
  }

  const handleSyncSpotify = async () => {
    if (spotifyActionLoading) {
      return
    }

    try {
      setSpotifyActionLoading(true)
      setError('')
      setSpotifyMessage('')

      const res = await api.post('/music/spotify/sync')
      if (res.data?.success) {
        setMusicProfile(res.data.musicProfile)
        setSpotifyMessage('Spotify music data synced fresh from Spotify! 🎵')
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sync Spotify data'))
    } finally {
      setSpotifyActionLoading(false)
    }
  }

  const handleDisconnectSpotify = async () => {
    if (spotifyActionLoading) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to disconnect Spotify from your profile?',
    )
    if (!confirmed) return

    try {
      setSpotifyActionLoading(true)
      setError('')
      setSpotifyMessage('')

      await api.post('/music/spotify/disconnect')
      setMusicProfile((prev) => ({
        ...prev,
        spotifyConnected: false,
        spotifyId: null,
      }))
      setSpotifyMessage('Spotify account disconnected successfully.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to disconnect Spotify'))
    } finally {
      setSpotifyActionLoading(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const convertToArray = (value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const toggleVibeTag = (tag) => {
    setForm((current) => {
      const alreadySelected =
        current.vibeTags.includes(tag)

      return {
        ...current,
        vibeTags: alreadySelected
          ? current.vibeTags.filter(
              (item) => item !== tag,
            )
          : [...current.vibeTags, tag],
      }
    })
  }

  const toggleInterestedIn = (gender) => {
    setPreferences((current) => {
      const alreadySelected =
        current.interestedIn.includes(gender)

      return {
        ...current,
        interestedIn: alreadySelected
          ? current.interestedIn.filter(
              (item) => item !== gender,
            )
          : [...current.interestedIn, gender],
      }
    })
  }

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (imageUploading) {
      event.target.value = ''
      return
    }

    setError('')
    setImageSuccess('')

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        'Only JPG, PNG and WebP images are allowed.',
      )
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        'Image must be smaller than 5 MB.',
      )
      event.target.value = ''
      return
    }

    setImageFile(file)

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const handleRemoveSelectedImage = () => {
    setImageFile(null)

    if (form.profileImage) {
      setImagePreview(
        getImageUrl(form.profileImage),
      )
    } else {
      setImagePreview('')
    }
  }

  const getNormalizedPhotos = () => {
    if (profile?.photos && profile.photos.length > 0) {
      return [...profile.photos].sort((a, b) => (a.order || 0) - (b.order || 0))
    }
    if (profile?.profileImage) {
      return [
        {
          _id: 'legacy-primary',
          url: profile.profileImage,
          isPrimary: true,
          order: 0,
        },
      ]
    }
    return []
  }

  const handleGalleryUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (imageUploading) {
      event.target.value = ''
      return
    }

    setError('')
    setImageSuccess('')

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Only JPG, PNG and WebP images are allowed.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be smaller than 5 MB.')
      event.target.value = ''
      return
    }

    try {
      setImageUploading(true)
      const formData = new FormData()
      formData.append('photo', file)

      const response = await api.post('/users/me/photos', formData)
      const updatedUser = response.data.user

      setProfile(updatedUser)
      if (updatedUser.profileImage) {
        setImagePreview(getImageUrl(updatedUser.profileImage))
        setForm((current) => ({
          ...current,
          profileImage: updatedUser.profileImage,
        }))
      }

      login({ ...user, ...updatedUser }, token)
      setImageSuccess('Photo added to gallery successfully.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to upload photo.'))
    } finally {
      setImageUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteGalleryPhoto = async (photoId) => {
    if (imageUploading) {
      return
    }

    try {
      setImageUploading(true)
      setError('')
      setImageSuccess('')

      const response = await api.delete(`/users/me/photos/${photoId}`)
      const updatedUser = response.data.user

      setProfile(updatedUser)
      if (updatedUser.profileImage) {
        setImagePreview(getImageUrl(updatedUser.profileImage))
        setForm((current) => ({
          ...current,
          profileImage: updatedUser.profileImage,
        }))
      } else {
        setImagePreview('')
        setForm((current) => ({ ...current, profileImage: '' }))
      }

      login({ ...user, ...updatedUser }, token)
      setImageSuccess('Photo deleted successfully.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to delete photo.'))
    } finally {
      setImageUploading(false)
    }
  }

  const handleSetPrimaryPhoto = async (photoId) => {
    if (imageUploading) {
      return
    }

    try {
      setImageUploading(true)
      setError('')
      setImageSuccess('')

      const response = await api.put(`/users/me/photos/${photoId}/primary`)
      const updatedUser = response.data.user

      setProfile(updatedUser)
      if (updatedUser.profileImage) {
        setImagePreview(getImageUrl(updatedUser.profileImage))
        setForm((current) => ({
          ...current,
          profileImage: updatedUser.profileImage,
        }))
      }

      login({ ...user, ...updatedUser }, token)
      setImageSuccess('Primary profile photo updated.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update primary photo.'))
    } finally {
      setImageUploading(false)
    }
  }

  const handleMovePhoto = async (currentIndex, direction) => {
    if (imageUploading) {
      return
    }

    const currentPhotos = getNormalizedPhotos()
    const targetIndex = currentIndex + direction
    if (targetIndex < 0 || targetIndex >= currentPhotos.length) return

    const swapped = [...currentPhotos]
    const temp = swapped[currentIndex]
    swapped[currentIndex] = swapped[targetIndex]
    swapped[targetIndex] = temp

    const photoIds = swapped.map((p) => p._id)

    try {
      setImageUploading(true)
      setError('')
      setImageSuccess('')

      const response = await api.put('/users/me/photos/reorder', { photoIds })
      const updatedUser = response.data.user

      setProfile(updatedUser)
      if (updatedUser.profileImage) {
        setImagePreview(getImageUrl(updatedUser.profileImage))
        setForm((current) => ({
          ...current,
          profileImage: updatedUser.profileImage,
        }))
      }

      login({ ...user, ...updatedUser }, token)
      setImageSuccess('Photo gallery order updated.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to reorder photos.'))
    } finally {
      setImageUploading(false)
    }
  }

  const handleUploadImage = async () => {
    if (imageUploading) {
      return
    }

    if (!imageFile) {
      setError('Please select an image first.')
      return
    }

    try {
      setImageUploading(true)
      setError('')
      setImageSuccess('')

      const formData = new FormData()

      formData.append(
        'profileImage',
        imageFile,
      )

      const response = await api.post(
        '/users/me/profile-image',
        formData,
      )

      const updatedUser = response.data.user
      const profileImage =
        response.data.profileImage

      setProfile(updatedUser)

      setForm((current) => ({
        ...current,
        profileImage,
      }))

      login(
        {
          ...user,
          ...updatedUser,
        },
        token,
      )

      setImageFile(null)
      setImagePreview(
        getImageUrl(profileImage),
      )

      setImageSuccess(
        'Profile photo uploaded successfully.',
      )
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          'Unable to upload profile photo.',
        ),
      )
    } finally {
      setImageUploading(false)
    }
  }

  const handleSaveMusic = async () => {
    if (musicSaving) {
      return
    }

    try {
      setMusicSaving(true)
      setError('')
      setMusicSuccess('')

      await api.put('/music', {
        favoriteArtists:
          convertToArray(
            form.favoriteArtists,
          ),
        favoriteSongs:
          convertToArray(
            form.favoriteSongs,
          ),
        genres:
          convertToArray(
            form.favoriteGenres,
          ),
        vibeTags: form.vibeTags,
        topArtists: [],
        topTracks: [],
      })

      setMusicSuccess(
        'Music profile updated successfully.',
      )
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          'Unable to update music profile.',
        ),
      )
    } finally {
      setMusicSaving(false)
    }
  }

  const handleSave = async () => {
    if (saving) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await api.put(
        '/users/me',
        {
          name: form.name,
          age: form.age
            ? Number(form.age)
            : undefined,
          gender:
            form.gender || undefined,
          bio: form.bio,
          location: form.location,
          profileImage:
            form.profileImage,
          interests:
            convertToArray(
              form.interests,
            ),
          favoriteArtists:
            convertToArray(
              form.favoriteArtists,
            ),
          favoriteGenres:
            convertToArray(
              form.favoriteGenres,
            ),
          favoriteSongs:
            convertToArray(
              form.favoriteSongs,
            ),
        },
      )

      const updatedUser =
        response.data.user

      setProfile(updatedUser)

      login(
        {
          ...user,
          ...updatedUser,
        },
        token,
      )

      setSuccess(
        'Profile updated successfully.',
      )
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          'Unable to update your profile.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences =
    async () => {
      if (preferencesSaving) {
        return
      }

      try {
        setPreferencesSaving(true)
        setError('')
        setPreferencesSuccess('')

        const minAge = Number(
          preferences.minAge,
        )

        const maxAge = Number(
          preferences.maxAge,
        )

        const minVibeScore = Number(
          preferences.minVibeScore,
        )

        if (
          minAge < 18 ||
          maxAge > 100 ||
          minAge > maxAge
        ) {
          setError(
            'Please select a valid age range.',
          )
          return
        }

        if (
          minVibeScore < 0 ||
          minVibeScore > 100
        ) {
          setError(
            'Vibe Score must be between 0 and 100.',
          )
          return
        }

        const response =
          await api.put(
            '/users/me/preferences',
            {
              interestedIn:
                preferences.interestedIn,
              minAge,
              maxAge,
              minVibeScore,
              showSimilarMusic:
                preferences.showSimilarMusic,
            },
          )

        setPreferences(
          response.data.preferences,
        )

        setPreferencesSuccess(
          'Dating preferences saved successfully.',
        )
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            'Unable to save dating preferences.',
          ),
        )
      } finally {
        setPreferencesSaving(false)
      }
    }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-24 text-white sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent sm:mx-0" />

          <p className="mt-4 text-sm text-slate-400 sm:text-base">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  if (!profile && error) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 pb-12 pt-24 text-white sm:px-6 sm:pb-16 sm:pt-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-400 sm:text-sm sm:tracking-[0.2em]">
            Your Profile
          </p>

          <div className="mt-5 rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-center backdrop-blur-xl sm:p-10">
            <div className="text-4xl">⚠️</div>

            <p className="mt-3 text-lg font-semibold text-red-300">
              {error}
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              We couldn't load your profile right now. Your data is safe — please try again.
            </p>

            <button
              type="button"
              onClick={loadProfile}
              className="mt-5 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              🔁 Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 px-4 pb-12 pt-24 text-white sm:px-6 sm:pb-16 sm:pt-32">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-400 sm:text-sm sm:tracking-[0.2em]">
            Your Profile
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:mt-3 sm:text-5xl">
            Build your vibe.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:mt-4 sm:text-base">
            Tell VibeMatch about yourself, your
            interests and your music taste.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm leading-6 text-red-300 sm:mb-6 sm:px-5">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm leading-6 text-emerald-300 sm:mb-6 sm:px-5">
            {success}
          </div>
        )}

        {musicSuccess && (
          <div className="mb-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-4 text-sm leading-6 text-fuchsia-300 sm:mb-6 sm:px-5">
            {musicSuccess}
          </div>
        )}

        {imageSuccess && (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm leading-6 text-emerald-300 sm:mb-6 sm:px-5">
            {imageSuccess}
          </div>
        )}

        {preferencesSuccess && (
          <div className="mb-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-4 text-sm leading-6 text-fuchsia-300 sm:mb-6 sm:px-5">
            {preferencesSuccess}
          </div>
        )}

        {/* PROFILE COMPLETENESS */}
        {profile && (
          <ProfileCompletenessBar
            profile={profile}
            form={form}
            musicForm={form}
          />
        )}

        {/* VIBE CARD PREVIEW */}
        {profile && (
          <ProfilePreviewCard
            profile={profile}
            form={form}
            musicForm={form}
            getImageUrl={getImageUrl}
            spotifyConnected={musicProfile?.spotifyConnected}
          />
        )}

        <div className="space-y-5 sm:space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <h2 className="text-lg font-semibold sm:text-xl">
              Basic information
            </h2>

            <div className="mt-5 rounded-2xl border border-fuchsia-400/10 bg-fuchsia-500/5 p-4 sm:mt-6 sm:p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-fuchsia-400/30 bg-slate-900 sm:mx-0 sm:h-32 sm:w-32">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={
                        form.name ||
                        'Profile'
                      }
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={() => {
                        setImagePreview('')
                      }}
                    />
                  ) : (
                    <span className="text-5xl">
                      👤
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-sm font-semibold text-white">
                    Profile photo
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    JPG, PNG or WebP.
                    Maximum file size:
                    5 MB.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <label
                      className={`cursor-pointer rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200 ${
                        imageUploading
                          ? 'pointer-events-none opacity-60'
                          : ''
                      }`}
                    >
                      Choose photo

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={
                          handleImageSelect
                        }
                        disabled={imageUploading}
                        className="hidden"
                      />
                    </label>

                    {imageFile && (
                      <>
                        <button
                          type="button"
                          onClick={
                            handleUploadImage
                          }
                          disabled={
                            imageUploading
                          }
                          className="rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {imageUploading
                            ? 'Uploading...'
                            : 'Upload photo'}
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleRemoveSelectedImage
                          }
                          disabled={
                            imageUploading
                          }
                          className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>

                  {imageFile && (
                    <p className="mt-3 break-all text-xs text-fuchsia-300">
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 6-SLOT PHOTO GALLERY MANAGER */}
            <div className="mt-6 rounded-2xl border border-fuchsia-400/10 bg-fuchsia-500/5 p-4 sm:p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white sm:text-lg">
                    Profile Photo Gallery
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload up to 6 photos. The primary photo is displayed across VibeMatch.
                  </p>
                </div>
                <span className="self-start sm:self-auto rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-300 border border-fuchsia-400/30">
                  {getNormalizedPhotos().length} / 6 Photos
                </span>
              </div>

              {getNormalizedPhotos().length === 0 && (
                <div className="mb-4 rounded-2xl border border-dashed border-fuchsia-400/30 bg-fuchsia-500/5 p-4 text-center">
                  <p className="text-sm font-semibold text-fuchsia-200">
                    📷 No photos yet
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                    Add at least one photo to your gallery — profiles with photos get
                    more matches.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, slotIdx) => {
                  const currentPhotos = getNormalizedPhotos()
                  const photo = currentPhotos[slotIdx]
                  const isPrimary =
                    photo?.isPrimary ||
                    (slotIdx === 0 &&
                      photo &&
                      !currentPhotos.some((p) => p.isPrimary))

                  if (photo) {
                    const photoUrl = getImageUrl(photo.url)
                    return (
                      <div
                        key={photo._id || slotIdx}
                        className="group relative h-44 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-md sm:h-52"
                      >
                        <img
                          src={photoUrl}
                          alt={`Gallery photo ${slotIdx + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        {isPrimary && (
                          <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-fuchsia-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
                            ⭐ Primary
                          </span>
                        )}

                        <div className="absolute inset-0 z-20 flex flex-col justify-between bg-slate-950/70 p-2 opacity-0 transition duration-200 group-hover:opacity-100">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryPhoto(photo._id)}
                              disabled={imageUploading}
                              className="rounded-xl bg-rose-600/90 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-600 transition shadow-sm"
                              title="Delete photo"
                            >
                              🗑️ Delete
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryPhoto(photo._id)}
                                disabled={imageUploading}
                                className="w-full rounded-xl bg-fuchsia-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-500 transition shadow-sm"
                              >
                                Make Primary
                              </button>
                            )}

                            <div className="flex gap-1">
                              {slotIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(slotIdx, -1)}
                                  disabled={imageUploading}
                                  className="flex-1 rounded-xl bg-white/20 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/30 transition"
                                >
                                  ← Move
                                </button>
                              )}
                              {slotIdx < currentPhotos.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(slotIdx, 1)}
                                  disabled={imageUploading}
                                  className="flex-1 rounded-xl bg-white/20 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/30 transition"
                                >
                                  Move →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const isNextUploadSlot = slotIdx === currentPhotos.length

                  return (
                    <div
                      key={`empty-slot-${slotIdx}`}
                      className={`relative h-44 w-full rounded-2xl border-2 border-dashed transition sm:h-52 flex flex-col items-center justify-center p-3 text-center ${
                        isNextUploadSlot
                          ? 'border-fuchsia-400/40 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 cursor-pointer'
                          : 'border-white/10 bg-white/[0.02] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {isNextUploadSlot ? (
                        <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                          <span className="text-3xl text-fuchsia-400 mb-1">+</span>
                          <span className="text-xs font-semibold text-fuchsia-200">
                            {imageUploading ? 'Uploading...' : 'Add Photo'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            Slot {slotIdx + 1} of 6
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleGalleryUpload}
                            disabled={imageUploading}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-2xl text-slate-600">📷</span>
                          <span className="text-xs text-slate-500 mt-1">
                            Slot {slotIdx + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60 sm:text-base"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Age
                </label>

                <input
                  name="age"
                  type="number"
                  min="18"
                  max="100"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60 sm:text-base"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Gender
                </label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60 sm:text-base"
                >
                  <option value="">
                    Select gender
                  </option>
                  <option value="male">
                    Male
                  </option>
                  <option value="female">
                    Female
                  </option>
                  <option value="non-binary">
                    Non-binary
                  </option>
                  <option value="prefer-not-to-say">
                    Prefer not to say
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Location
                </label>

                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Delhi"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60 sm:text-base"
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-5">
              <label className="mb-2 block text-sm text-slate-300">
                Bio
              </label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows="4"
                maxLength="500"
                placeholder="Tell people something about yourself..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60 sm:text-base"
              />

              <p className="mt-2 text-right text-xs text-slate-600">
                {form.bio.length}/500
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-400 sm:text-sm sm:tracking-[0.2em]">
                Discover preferences
              </p>

              <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                Who do you want to discover?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                These preferences help VibeMatch
                personalize your discovery experience.
              </p>
            </div>

            <div className="mt-6 sm:mt-7">
              <label className="mb-3 block text-sm font-medium text-slate-300">
                Interested in
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: 'male',
                    label: 'Men',
                    emoji: '👨',
                  },
                  {
                    value: 'female',
                    label: 'Women',
                    emoji: '👩',
                  },
                  {
                    value: 'non-binary',
                    label: 'Non-binary',
                    emoji: '🧑',
                  },
                ].map((option) => {
                  const selected =
                    preferences.interestedIn.includes(
                      option.value,
                    )

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        toggleInterestedIn(
                          option.value,
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? 'border-fuchsia-400 bg-fuchsia-500/15 text-white shadow-lg shadow-fuchsia-500/10'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">
                          {option.emoji}
                        </span>

                        {selected && (
                          <span className="text-fuchsia-300">
                            ✓
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm font-semibold sm:text-base">
                        {option.label}
                      </p>
                    </button>
                  )
                })}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                You can select more than one.
              </p>
            </div>

            <div className="mt-6 sm:mt-7">
              <label className="mb-3 block text-sm font-medium text-slate-300">
                Preferred age range
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-slate-500">
                    Minimum age
                  </label>

                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={preferences.minAge}
                    onChange={(event) =>
                      setPreferences(
                        (current) => ({
                          ...current,
                          minAge:
                            event.target.value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60 sm:text-base"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-slate-500">
                    Maximum age
                  </label>

                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={preferences.maxAge}
                    onChange={(event) =>
                      setPreferences(
                        (current) => ({
                          ...current,
                          maxAge:
                            event.target.value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60 sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-slate-300">
                    Minimum Vibe Score
                  </label>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Only show people with at least
                    this compatibility score.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-3 py-2 text-sm font-bold text-fuchsia-300 sm:px-4">
                  {preferences.minVibeScore}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={preferences.minVibeScore}
                onChange={(event) =>
                  setPreferences(
                    (current) => ({
                      ...current,
                      minVibeScore:
                        Number(
                          event.target.value,
                        ),
                    }),
                  )
                }
                className="mt-5 w-full accent-fuchsia-500"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-600">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
              <div className="min-w-0">
                <p className="font-semibold">
                  Show similar music matches
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Give extra importance to people
                  with similar music taste.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={
                  preferences.showSimilarMusic
                }
                onClick={() =>
                  setPreferences(
                    (current) => ({
                      ...current,
                      showSimilarMusic:
                        !current.showSimilarMusic,
                    }),
                  )
                }
                className={`relative h-7 w-12 shrink-0 self-end rounded-full transition sm:self-auto ${
                  preferences.showSimilarMusic
                    ? 'bg-fuchsia-500'
                    : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    preferences.showSimilarMusic
                      ? 'left-6'
                      : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={
                handleSavePreferences
              }
              disabled={
                preferencesSaving
              }
              className="mt-6 w-full rounded-2xl bg-fuchsia-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-7 sm:text-base"
            >
              {preferencesSaving
                ? 'Saving preferences...'
                : 'Save dating preferences'}
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <h2 className="text-lg font-semibold sm:text-xl">
              Your music vibe
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your music taste helps VibeMatch find compatible people.
            </p>

            {/* SPOTIFY INTEGRATION PANEL */}
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.488 17.306c-.217.355-.678.47-1.033.253-2.83-1.728-6.393-2.119-10.589-1.161-.403.092-.806-.157-.899-.56-.092-.403.157-.806.56-.899 4.6-1.05 8.537-.604 11.708 1.334.355.217.47.678.253 1.033zm1.464-3.26c-.273.444-.858.587-1.302.314-3.24-1.992-8.178-2.568-12.01-1.405-.499.151-1.026-.134-1.177-.633-.151-.499.134-1.026.633-1.177 4.385-1.331 9.818-.693 13.542 1.599.444.273.587.858.314 1.302zm.126-3.41c-3.885-2.308-10.29-2.52-13.99-1.396-.596.182-1.23-.162-1.412-.758-.182-.596.162-1.23.758-1.412 4.254-1.292 11.31-1.045 15.79 1.615.536.318.71 1.013.392 1.549-.318.536-1.013.71-1.538.402z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-white sm:text-lg">
                        Spotify Music
                      </h3>
                      {musicProfile?.spotifyConnected ? (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          Connected
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          Not Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {musicProfile?.spotifyConnected
                        ? `Linked${musicProfile.spotifyId ? ` as ${musicProfile.spotifyId}` : ''}${musicProfile.lastSpotifySync ? ` • Synced ${new Date(musicProfile.lastSpotifySync).toLocaleDateString()}` : ''}`
                        : 'Connect Spotify to sync your top artists, tracks, and music vibe.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {musicProfile?.spotifyConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncSpotify}
                        disabled={spotifyActionLoading}
                        className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        {spotifyActionLoading ? 'Syncing...' : '🔄 Sync Fresh Data'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectSpotify}
                        disabled={spotifyActionLoading}
                        className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectSpotify}
                      disabled={spotifyActionLoading}
                      className="rounded-xl bg-[#1DB954] px-4 py-2.5 text-xs font-bold text-black transition hover:bg-[#1ed760] shadow-lg shadow-[#1DB954]/20 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {spotifyActionLoading ? 'Connecting...' : 'Connect Spotify'}
                    </button>
                  )}
                </div>
              </div>

              {spotifyMessage && (
                <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  {spotifyMessage}
                </div>
              )}

              {/* SPOTIFY NOT CONNECTED EMPTY STATE */}
              {!musicProfile?.spotifyConnected && (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
                  <p className="text-sm font-semibold text-slate-200">
                    🎧 Spotify not connected
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                    No Spotify music data yet. Connect your account to auto-sync your
                    top artists, tracks and genres — or fill them in manually below.
                  </p>
                </div>
              )}

              {/* Top highlights if connected */}
              {musicProfile?.spotifyConnected && (
                <div className="mt-4 pt-4 border-t border-white/10 grid gap-3 sm:grid-cols-2">
                  {Array.isArray(musicProfile.topArtists) && musicProfile.topArtists.length > 0 && (
                    <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                        Top Artists
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {musicProfile.topArtists.slice(0, 5).map((artist, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300 border border-white/10"
                          >
                            {artist}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(musicProfile.topTracks) && musicProfile.topTracks.length > 0 && (
                    <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                        Top Tracks
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {musicProfile.topTracks.slice(0, 4).map((track, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300 border border-white/10"
                          >
                            🎵 {track}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 space-y-5 sm:mt-6">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Favorite artists
                </label>

                <input
                  name="favoriteArtists"
                  value={
                    form.favoriteArtists
                  }
                  onChange={handleChange}
                  placeholder="Arijit Singh, The Weeknd, Drake"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60 sm:text-base"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Separate multiple artists with commas.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Favorite genres
                </label>

                <input
                  name="favoriteGenres"
                  value={
                    form.favoriteGenres
                  }
                  onChange={handleChange}
                  placeholder="Pop, Hip-Hop, Bollywood"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60 sm:text-base"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Favorite songs
                </label>

                <input
                  name="favoriteSongs"
                  value={
                    form.favoriteSongs
                  }
                  onChange={handleChange}
                  placeholder="Song 1, Song 2, Song 3"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60 sm:text-base"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm text-slate-300">
                  Your vibe
                </label>

                <p className="mb-4 text-xs leading-5 text-slate-500">
                  Select the vibes that describe your music personality.
                </p>

                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                  {VIBE_TAGS.map((tag) => {
                    const selected =
                      form.vibeTags.includes(
                        tag,
                      )

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          toggleVibeTag(tag)
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                          selected
                            ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-300 shadow-lg shadow-fuchsia-500/10'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-fuchsia-300'
                        }`}
                      >
                        {selected
                          ? '✓ '
                          : ''}
                        {tag}
                      </button>
                    )
                  })}
                </div>

                {form.vibeTags.length >
                  0 && (
                  <p className="mt-4 text-xs text-fuchsia-400">
                    {form.vibeTags.length}{' '}
                    vibe
                    {form.vibeTags.length >
                    1
                      ? 's'
                      : ''}{' '}
                    selected
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Interests
                </label>

                <input
                  name="interests"
                  value={form.interests}
                  onChange={handleChange}
                  placeholder="Travel, Cricket, Coding, Movies"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60 sm:text-base"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Separate multiple interests with commas.
                </p>

                {form.interests
                  .split(',')
                  .map((i) => i.trim())
                  .filter(Boolean).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.interests
                      .split(',')
                      .map((i) => i.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-base"
            >
              {saving
                ? 'Saving profile...'
                : 'Save profile'}
            </button>

            <button
              type="button"
              onClick={handleSaveMusic}
              disabled={musicSaving}
              className="w-full rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-4 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-base"
            >
              {musicSaving
                ? 'Saving music...'
                : 'Save music vibe'}
            </button>
          </div>
        </div>

        {profile && (
          <p className="mt-6 break-all text-center text-xs text-slate-600">
            Profile ID: {profile._id}
          </p>
        )}
      </div>
    </div>
  )
}

export default Profile