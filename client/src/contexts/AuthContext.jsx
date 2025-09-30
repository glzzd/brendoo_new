import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Don't use window.location.href, let the app handle routing
      // The ProtectedRoute component will redirect to login
    }
    return Promise.reject(error)
  }
)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      
      console.log('Checking auth - Token:', token ? 'exists' : 'not found')
      console.log('Checking auth - User data:', userData ? 'exists' : 'not found')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          console.log('Parsed user:', parsedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await api.post('/auth/login', { email, password })
      
      console.log('Login response:', response.data)
      
      if (response.data.success) {
        const { token, user } = response.data.data // Backend data obyekti içində göndərir
        
        console.log('Login successful - Token:', token ? 'received' : 'missing')
        console.log('Login successful - User:', user)
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        console.log('Stored in localStorage - Token:', localStorage.getItem('token') ? 'stored' : 'failed')
        console.log('Stored in localStorage - User:', localStorage.getItem('user') ? 'stored' : 'failed')
        
        setUser(user)
        setIsAuthenticated(true)
        
        return { success: true, user }
      } else {
        return { success: false, message: response.data.message || 'Giriş uğursuz oldu' }
      }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.message || 'Giriş zamanı xəta baş verdi'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await api.post('/auth/register', userData)
      
      if (response.data.success) {
        const { token, user } = response.data.data // Backend data obyekti içində göndərir
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        setUser(user)
        setIsAuthenticated(true)
        
        return { success: true, user }
      } else {
        return { success: false, message: response.data.message || 'Qeydiyyat uğursuz oldu' }
      }
    } catch (error) {
      console.error('Register error:', error)
      const message = error.response?.data?.message || 'Qeydiyyat zamanı xəta baş verdi'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Reset state
      setUser(null)
      setIsAuthenticated(false)
      
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, message: 'Çıxış zamanı xəta baş verdi' }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      setLoading(true)
      const response = await api.put('/auth/profile', profileData)
      
      if (response.data.success) {
        const updatedUser = response.data.user
        
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        
        return { success: true, user: updatedUser }
      } else {
        return { success: false, message: response.data.message || 'Profil yenilənmədi' }
      }
    } catch (error) {
      console.error('Update profile error:', error)
      const message = error.response?.data?.message || 'Profil yenilənməsi zamanı xəta baş verdi'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    api // Export api instance for other components to use
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext