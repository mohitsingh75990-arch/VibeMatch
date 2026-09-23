import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'

function Chat() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  const typingTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)

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
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load user profile',
      )
    }
  }

  const loadMessages = async () => {
    try {
      const response = await api.get(`/messages/${userId}`)
      setMessages(response.data.messages || [])
      setError('')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load conversation',
      )
    } finally {
      setLoading(false)
    }
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

  useEffect(() => {
    loadUser()
    loadMessages()

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

    const handleUserOffline = ({ userId: offlineUserId }) => {
      if (offlineUserId === userId) {
        setIsOnline(false)
        setIsTyping(false)
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

    const interval = setInterval(() => {
      loadMessages()
      markMessagesDelivered()
      markMessagesRead()
    }, 10000)

    return () => {
      clearInterval(interval)

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
        err.response?.data?.message ||
          'Unable to send message',
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

            <p className="text-sm text-slate-500">
              {isTyping ? (
                `${user?.name || 'They'} is typing...`
              ) : isOnline ? (
                <span className="text-emerald-600">
                  🟢 Online
                </span>
              ) : (
                <span>⚪ Offline</span>
              )}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="flex min-h-full flex-col gap-3">
            {loading && (
              <p className="m-auto text-center text-slate-500">
                Loading conversation...
              </p>
            )}

            {!loading && messages.length === 0 && (
              <div className="m-auto text-center">
                <p className="text-lg font-semibold text-slate-700">
                  Start the conversation 💜
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Say hello to your match.
                </p>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.sender?._id !== userId
              const status = getMessageStatus(message)

              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isMine
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                      isMine
                        ? 'rounded-br-md bg-violet-600 text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="break-words text-sm">
                      {message.text}
                    </p>

                    <div className="mt-1 flex items-center justify-end gap-1">
                      <p
                        className={`text-[10px] ${
                          isMine
                            ? 'text-violet-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {new Date(
                          message.createdAt,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {status && (
                        <span
                          className={`text-[11px] font-semibold ${
                            status === 'read'
                              ? 'text-sky-300'
                              : isMine
                                ? 'text-violet-200'
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
                          {status === 'sent'
                            ? '✓'
                            : '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white">
          {error && (
            <div className="px-4 pt-2 text-sm text-red-600 sm:px-5">
              {error}
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
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat