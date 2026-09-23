import api from './api'

export const getNotificationPreferences = async () => {
  const response = await api.get(
    '/notification-preferences',
  )

  return response.data
}

export const updateNotificationPreferences =
  async (preferences) => {
    const response = await api.put(
      '/notification-preferences',
      preferences,
    )

    return response.data
  }