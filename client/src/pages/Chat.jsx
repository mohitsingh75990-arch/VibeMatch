import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'
import { getApiErrorMessage } from '../services/errors'

const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return 'Offline'
  const time = new Date(lastSeenDate).getTime()
  if (Number.isNaN(time)) return 'Offline'
  const diff = Date.now() - time
  if (diff < 60000) return 'Active just now'
  if (diff < 3600000) return `Active ${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `Active ${Math.floor(diff / 3600000)}h ago`
  return `Active ${new Date(lastSeenDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

const formatDateSeparator = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

function Chat() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [targetLastSeen, setTargetLastSeen] = useState(null)
  const [icebreakers, setIcebreakers] = useState([])
  const [icebreakersLoading, setIcebreakersLoading] = useState(false)
  const [showIcebreakers, setShowIcebreakers] = useState(true)

  const typingTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)
  const loadingRef = useRef(false)

  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem('vibematch_user')

    if (!storedUser) {
      return null
    }

    try {
      return JSON.parse(storedUser).id
    } catch {
      return null
    }
  }

  const getProfileImageUrl = (profileImage) => {
    if (!profileImage) {
      return null
    }

    if (
      profileImage.startsWith('http://') ||
      profileImage.startsWith('https://')
    ) {
      return profileImage
    }

    const apiUrl =
      import.meta.env.VITE_API_URL ||
      'http://localhost:5000/api'

    const backendUrl = apiUrl.replace(
      /\/api\/?$/,
      '',
    )

    const normalizedPath = profileImage.startsWith('/')
      ? profileImage
      : `/${profileImage}`

    return `${backendUrl}${normalizedPath}`
  }

  const loadUser = async () => {
    try {
      const response = await api.get(`/users/${userId}`)
      setUser(response.data.user)
      if (response.data.user?.lastSeen) {
        setTargetLastSeen(response.data.user.lastSeen)
      }
    } catch (err) {
      setLoadError(
        getApiErrorMessage(
          err,
          'Unable to load user profile',
        ),
      )
    }
  }

  const loadMessages = async () => {
    // Prevent duplicate/overlapping requests while one is pending.
    if (loadingRef.current) {
      return
    }

    loadingRef.current = true

    try {
      const response = await api.get(`/messages/${userId}`)
      setMessages(response.data.messages || [])
      setLoadError('')
    } catch (err) {
      setLoadError(
        getApiErrorMessage(
          err,
          'Unable to load conversation',
        ),
      )
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  const handleRetryConversation = async () => {
    if (loadingRef.current) {
      return
    }

    setLoading(true)
    setLoadError('')
    setError('')

    await loadMessages()
    await loadUser()
  }

  const markMessagesDelivered = async () => {
    try {
      await api.put(`/messages/${userId}/delivered`)
    } catch (err) {
      console.error(
        'Unable to mark messages as delivered:',
        err,
      )
    }
  }

  const markMessagesRead = async () => {
    try {
      await api.put(`/messages/${userId}/read`)
    } catch (err) {
      console.error(
        'Unable to mark messages as read:',
        err,
      )
    }
  }

  const loadIcebreakers = async () => {
    if (!userId) {
      return
    }

    try {
      setIcebreakersLoading(true)
      const response = await api.get(`/ai/icebreakers/${userId}`)
      if (Array.isArray(response.data?.icebreakers)) {
        const sanitized = response.data.icebreakers
          .filter(
            (item) =>
              typeof item === 'string' &&
              item.trim().length > 0,
          )
          .map((item) => item.trim().slice(0, 300))
        setIcebreakers(sanitized)
      } else {
        setIcebreakers([])
      }
    } catch (err) {
      console.error(
        'Failed to load AI icebreakers:',
        err.response?.status,
        err.response?.data || err.message,
      )
      setIcebreakers([])
    } finally {
      setIcebreakersLoading(false)
    }
  }

  const handleSelectIcebreaker = (starter) => {
    if (typeof starter === 'string') {
      setText(starter)
    }
  }

  useEffect(() => {
    const initConversation = async () => {
      await loadMessages()
      loadUser()
      loadIcebreakers()
    }

    initConversation()

    const currentUserId = getCurrentUserId()

    if (!currentUserId) {
      return
    }

    const handleConnect = () => {
      console.log('Chat socket already connected')
      socket.emit('get_online_users')
    }

    const handleOnlineUsers = ({ userIds = [] }) => {
      setIsOnline(userIds.includes(userId))
    }

    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.sender?._id
      const receiverId = newMessage.receiver?._id

      const belongsToCurrentChat =
        senderId === userId || receiverId === userId

      if (!belongsToCurrentChat) {
        return
      }

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (message) => message._id === newMessage._id,
        )

        if (alreadyExists) {
          return currentMessages
        }

        return [...currentMessages, newMessage]
      })

      if (senderId === userId) {
        markMessagesDelivered()
        markMessagesRead()
      }
    }

    const handleUserTyping = ({ senderId }) => {
      if (senderId === userId) {
        setIsTyping(true)
      }
    }

    const handleUserStopTyping = ({ senderId }) => {
      if (senderId === userId) {
        setIsTyping(false)
      }
    }

    const handleUserOnline = ({ userId: onlineUserId }) => {
      if (onlineUserId === userId) {
        setIsOnline(true)
      }
    }

    const handleUserOffline = ({ userId: offlineUserId, lastSeen }) => {
      if (offlineUserId === userId) {
        setIsOnline(false)
        setIsTyping(false)
        if (lastSeen) {
          setTargetLastSeen(lastSeen)
        }
      }
    }

    const handleMessageDelivered = ({ userId: senderId }) => {
      if (senderId !== currentUserId) {
        return
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (
            message.sender?._id === currentUserId &&
            !message.deliveredAt
          ) {
            return {
              ...message,
              deliveredAt: new Date().toISOString(),
            }
          }

          return message
        }),
      )
    }

    const handleMessageRead = ({ userId: readerId }) => {
      if (readerId !== userId) {
        return
      }

      const readTime = new Date().toISOString()

      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (message.sender?._id === currentUserId) {
            return {
              ...message,
              deliveredAt:
                message.deliveredAt || readTime,
              readAt:
                message.readAt || readTime,
            }
          }

          return message
        }),
      )
    }

    socket.on('connect', handleConnect)
    socket.on('online_users', handleOnlineUsers)
    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stop_typing', handleUserStopTyping)
    socket.on('user_online', handleUserOnline)
    socket.on('user_offline', handleUserOffline)
    socket.on(
      'message_delivered',
      handleMessageDelivered,
    )
    socket.on(
      'message_read',
      handleMessageRead,
    )

    if (socket.connected) {
      socket.emit('get_online_users')
    }

    markMessagesDelivered()
    markMessagesRead()

    return () => {

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      socket.off('connect', handleConnect)
      socket.off('online_users', handleOnlineUsers)
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stop_typing', handleUserStopTyping)
      socket.off('user_online', handleUserOnline)
      socket.off('user_offline', handleUserOffline)
      socket.off(
        'message_delivered',
        handleMessageDelivered,
      )
      socket.off(
        'message_read',
        handleMessageRead,
      )

      // IMPORTANT:
      // Chat does NOT disconnect the global socket.
      // AuthContext owns the socket connection.
    }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  const handleTextChange = (event) => {
    const value = event.target.value

    setText(value)

    const currentUserId = getCurrentUserId()

    if (!currentUserId || !userId) {
      return
    }

    if (!value.trim()) {
      socket.emit('stop_typing', {
        senderId: currentUserId,
        receiverId: userId,
      })

      return
    }

    socket.emit('typing', {
      senderId: currentUserId,
      receiverId: userId,
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        senderId: currentUserId,
        receiverId: userId,
      })
    }, 1200)
  }

  const handleSend = async (event) => {
    event.preventDefault()

    if (!text.trim() || sending) {
      return
    }

    const currentUserId = getCurrentUserId()

    socket.emit('stop_typing', {
      senderId: currentUserId,
      receiverId: userId,
    })

    try {
      setSending(true)

      const response = await api.post('/messages', {
        receiver: userId,
        text: text.trim(),
      })

      setMessages((currentMessages) => {
        const newMessage = response.data.data

        const alreadyExists = currentMessages.some(
          (message) => message._id === newMessage._id,
        )

        if (alreadyExists) {
          return currentMessages
        }

        return [...currentMessages, newMessage]
      })

      setText('')
      setError('')
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Unable to send message'),
      )
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const getMessageStatus = (message) => {
    const currentUserId = getCurrentUserId()

    if (message.sender?._id !== currentUserId) {
      return null
    }

    if (message.readAt) {
      return 'read'
    }

    if (message.deliveredAt) {
      return 'delivered'
    }

    return 'sent'
  }

  const profileImageUrl = getProfileImageUrl(
    user?.profileImage,
  )

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-50 px-2 py-2 sm:px-4 sm:py-4">
      <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-lg sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="rounded-full px-3 py-2 text-xl text-slate-600 hover:bg-slate-100"
          >
            ←
          </button>

          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={user?.name || 'Profile'}
              loading="lazy"
              className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl sm:h-12 sm:w-12">
              💜
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {user?.name || 'Chat'}
              {user?.age ? `, ${user.age}` : ''}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              {isTyping ? (
                <span className="text-violet-600 font-medium animate-pulse">
                  ✍️ typing...
                </span>
              ) : isOnline ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="text-slate-400">
                  ⚪ {formatLastSeen(targetLastSeen || user?.lastSeen)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="flex min-h-full flex-col gap-3">
            {loading && (
              <div className="m-auto text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading conversation...
                </p>
              </div>
            )}

            {!loading && messages.length === 0 && loadError && (
              <div className="m-auto max-w-md px-4 py-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl shadow-sm">
                  ⚠️
                </div>

                <p className="text-lg font-bold text-slate-800">
                  Couldn't load this conversation
                </p>

                <p className="mt-1 break-words text-sm text-slate-500">
                  {loadError}
                </p>

                <button
                  type="button"
                  onClick={handleRetryConversation}
                  className="mt-5 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  🔁 Retry
                </button>
              </div>
            )}

            {!loading && messages.length === 0 && !loadError && (
              <div className="m-auto text-center px-4 py-6 max-w-md">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-violet-100 to-fuchsia-100 text-3xl shadow-sm">
                  💜
                </div>

                <p className="text-lg font-bold text-slate-800">
                  Start your vibe with {user?.name || 'your match'} ✨
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Break the ice, talk music, or send an AI suggestion below.
                </p>

                {icebreakersLoading ? (
                  <div className="mt-5 rounded-2xl bg-violet-50/70 p-4 border border-violet-100 text-center">
                    <p className="text-xs font-semibold text-violet-600 flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin">✨</span>
                      <span>Generating AI icebreakers...</span>
                    </p>
                  </div>
                ) : icebreakers.length > 0 ? (
                  <div className="mt-5 rounded-2xl bg-gradient-to-br from-violet-50 via-fuchsia-50/50 to-pink-50 p-4 border border-violet-100 text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5 mb-2.5">
                      <span>✨</span>
                      <span>AI Icebreakers (click to paste)</span>
                    </p>
                    <div className="flex flex-col gap-2">
                      {icebreakers.map((starter, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectIcebreaker(starter)}
                          className="rounded-xl border border-violet-200/80 bg-white/90 p-2.5 text-left text-xs font-medium text-slate-800 shadow-xs transition hover:bg-violet-50/70 hover:border-violet-300 active:scale-[0.98]"
                        >
                          💬 {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={loadIcebreakers}
                      disabled={icebreakersLoading}
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3.5 py-1.5 text-xs font-medium text-violet-700 shadow-xs transition hover:bg-violet-50 hover:border-violet-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>✨</span>
                      <span>
                        {icebreakersLoading
                          ? 'Generating...'
                          : 'Generate AI Icebreakers'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {messages.map((message, index) => {
              const isMine = message.sender?._id !== userId
              const status = getMessageStatus(message)
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showDateSeparator =
                !prevMessage ||
                new Date(message.createdAt).toDateString() !==
                  new Date(prevMessage.createdAt).toDateString()

              return (
                <div key={message._id} className="space-y-3">
                  {showDateSeparator && (
                    <div className="flex justify-center my-2">
                      <span className="rounded-full bg-slate-200/80 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-2xs">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 sm:max-w-[75%] shadow-xs ${
                        isMine
                          ? 'rounded-br-md bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                          : 'rounded-bl-md bg-white border border-slate-200/70 text-slate-800'
                      }`}
                    >
                      <p className="break-words text-sm leading-relaxed">
                        {message.text}
                      </p>

                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <span
                          className={`text-[10px] ${
                            isMine ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {status && (
                          <span
                            className={`text-[11px] font-bold ${
                              status === 'read'
                                ? 'text-sky-300'
                                : isMine
                                ? 'text-white/70'
                                : 'text-slate-400'
                            }`}
                            title={
                              status === 'read'
                                ? 'Read'
                                : status === 'delivered'
                                ? 'Delivered'
                                : 'Sent'
                            }
                          >
                            {status === 'sent' ? '✓' : '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white border border-slate-200/70 px-4 py-2.5 text-slate-500 shadow-xs">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-600" />
                  <span className="ml-1 text-xs text-slate-400">
                    {user?.name || 'They'} is typing...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white">
          {showIcebreakers && icebreakers.length > 0 && (
            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/70 to-fuchsia-50/70 px-3 py-2 sm:px-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
                  <span>✨</span>
                  <span>AI Suggestions</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowIcebreakers(false)}
                  className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:text-slate-600"
                  title="Dismiss AI suggestions"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {icebreakers.map((starter, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectIcebreaker(starter)}
                    className="truncate max-w-[280px] sm:max-w-xs rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-900 active:scale-95"
                    title={starter}
                  >
                    💡 {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(error || (loadError && messages.length > 0)) && (
            <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 pt-2 pb-2 text-sm text-red-600 sm:px-5">
              <span className="min-w-0 break-words">
                {error || loadError}
              </span>

              {loadError && (
                <button
                  type="button"
                  onClick={handleRetryConversation}
                  className="shrink-0 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  🔁 Retry
                </button>
              )}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="flex gap-2 p-3 sm:gap-3 sm:p-4"
          >
            <input
              type="text"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={2000}
              className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="shrink-0 rounded-full bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
            >
              {sending ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Send'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat