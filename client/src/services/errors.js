/**
 * Shared helpers for turning API/axios failures into friendly,
 * user-facing messages without breaking the page.
 */

const STATUS_MESSAGES = {
  401: 'Your session has expired. Please sign in again to continue.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  408: 'The request took too long. Please try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again.',
  502: 'The server is taking longer than expected. Please try again.',
  503: 'The service is temporarily unavailable. Please try again.',
}

const NETWORK_MESSAGE =
  'Unable to reach the server. Please check your connection and try again.'

/**
 * Returns a friendly message for an axios/api error.
 *
 * @param {unknown} error - caught axios error
 * @param {string} fallback - message used when nothing more specific applies
 * @returns {string}
 */
export function getApiErrorMessage(
  error,
  fallback = 'Something went wrong. Please try again.',
) {
  if (!error?.response) {
    return NETWORK_MESSAGE
  }

  const status = error.response.status

  if (status === 401) {
    return STATUS_MESSAGES[401]
  }

  const serverMessage =
    typeof error.response.data?.message === 'string'
      ? error.response.data.message.trim()
      : ''

  if (serverMessage) {
    return serverMessage
  }

  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status]
  }

  if (status >= 500) {
    return STATUS_MESSAGES[500]
  }

  return fallback
}

/**
 * True when the request failed because of missing/invalid auth.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAuthError(error) {
  return error?.response?.status === 401
}
