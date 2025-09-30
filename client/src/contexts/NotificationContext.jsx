import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Auto-remove notification after 10 seconds if it's a success type
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 10000)
    }
  }

  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== id)
    })
  }

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => {
        if (notification.id === id && !notification.read) {
          setUnreadCount(count => Math.max(0, count - 1))
          return { ...notification, read: true }
        }
        return notification
      })
    )
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  // Clear all notifications
  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  // Simulate polling for async request updates (in a real app, this would be WebSocket or SSE)
  useEffect(() => {
    if (!user) return

    const pollForUpdates = async () => {
      try {
        const token = localStorage.getItem('token')
        console.log('Polling for notifications with token:', token ? 'Token exists' : 'No token found')
        
        if (!token) {
          console.log('No token found, skipping notification poll')
          return
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://69.62.114.202:5000'}/api/async-requests/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Notification poll response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Notification poll response data:', data)
          if (data.success && data.notifications?.length > 0) {
            console.log('Adding notifications:', data.notifications.length)
            data.notifications.forEach(notification => {
              addNotification({
                type: 'info',
                title: 'Asenkron Sorğu Yenilənməsi',
                message: notification.message,
                requestId: notification.requestId,
                data: notification.data
              })
            })
          } else {
            console.log('No new notifications')
          }
        } else {
          const errorData = await response.text()
          console.error('Notification poll failed:', response.status, errorData)
        }
      } catch (error) {
        console.error('Error polling for notifications:', error)
      }
    }

    // Poll every 30 seconds
    const interval = setInterval(pollForUpdates, 30000)
    
    // Initial poll
    pollForUpdates()

    return () => clearInterval(interval)
  }, [user])

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}