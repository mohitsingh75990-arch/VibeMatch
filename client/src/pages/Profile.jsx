import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

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

    return `http://localhost:5000${imagePath}`
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
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

        if (data.profileImage) {
          setImagePreview(
            getImageUrl(data.profileImage),
          )
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
            'Unable to load your profile.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

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

  const handleUploadImage = async () => {
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
        error.response?.data?.message ||
          'Unable to upload profile photo.',
      )
    } finally {
      setImageUploading(false)
    }
  }

  const handleSaveMusic = async () => {
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
        error.response?.data?.message ||
          'Unable to update music profile.',
      )
    } finally {
      setMusicSaving(false)
    }
  }

  const handleSave = async () => {
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
        error.response?.data?.message ||
          'Unable to update your profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences =
    async () => {
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
          error.response?.data?.message ||
            'Unable to save dating preferences.',
        )
      } finally {
        setPreferencesSaving(false)
      }
    }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-24 text-white sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-slate-400 sm:text-base">
            Loading your profile...
          </p>
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
          <div className="mb-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-4 text-sm leading-6 text-fuchsia-300 sm:mb-6 sm:px-5">
            {musicSuccess}
          </div>
        )}

        {imageSuccess && (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm leading-6 text-emerald-300 sm:mb-6 sm:px-5">
            {imageSuccess}
          </div>
        )}

        {preferencesSuccess && (
          <div className="mb-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-4 text-sm leading-6 text-fuchsia-300 sm:mb-6 sm:px-5">
            {preferencesSuccess}
          </div>
        )}

        <div className="space-y-5 sm:space-y-6">
          {/* BASIC INFORMATION */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <h2 className="text-lg font-semibold sm:text-xl">
              Basic information
            </h2>

            {/* PROFILE PHOTO */}

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
                    <label className="cursor-pointer rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                      Choose photo

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={
                          handleImageSelect
                        }
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

          {/* DATING PREFERENCES */}

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

            {/* INTERESTED IN */}

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

            {/* AGE RANGE */}

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

            {/* VIBE SCORE */}

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

            {/* SIMILAR MUSIC */}

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

          {/* MUSIC PROFILE */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <h2 className="text-lg font-semibold sm:text-xl">
              Your music vibe
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your music taste helps VibeMatch find compatible people.
            </p>

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
              </div>
            </div>
          </section>

          {/* ACTIONS */}

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