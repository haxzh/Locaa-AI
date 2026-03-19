import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('access_token'))
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

    const normalizeUser = (rawUser) => {
        if (!rawUser) return null

        const first = (rawUser.first_name || '').trim()
        const last = (rawUser.last_name || '').trim()
        const fullName = first ? [first, last].filter(Boolean).join(' ').trim() : ''

        return {
            ...rawUser,
            name: fullName || first || rawUser.username || rawUser.email?.split('@')[0] || rawUser.name || 'User'
        }
    }

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            validateToken(token)
        } else {
            setLoading(false)
        }
    }, [])

    const validateToken = async (token) => {
        try {
            const response = await axios.get(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUser(normalizeUser(response.data))
        } catch (err) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setToken(null)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const refreshAccessToken = async () => {
        try {
            const currentRefreshToken = localStorage.getItem('refresh_token')
            if (!currentRefreshToken) return null

            const response = await axios.post(
                `${API_BASE}/api/auth/refresh`,
                {},
                {
                    headers: { Authorization: `Bearer ${currentRefreshToken}` }
                }
            )

            const newAccessToken = response.data?.access_token
            if (!newAccessToken) return null

            localStorage.setItem('access_token', newAccessToken)
            setToken(newAccessToken)
            return newAccessToken
        } catch (err) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setToken(null)
            setUser(null)
            return null
        }
    }

    const register = async (email, username, password, firstName = '', lastName = '') => {
        try {
            setError(null)
            const response = await axios.post(`${API_BASE}/api/auth/register`, {
                email,
                username,
                password,
                first_name: firstName,
                last_name: lastName
            })

            localStorage.setItem('access_token', response.data.tokens.access_token)
            localStorage.setItem('refresh_token', response.data.tokens.refresh_token)
            setToken(response.data.tokens.access_token)
            setUser(normalizeUser(response.data.user))
            return { success: true, data: response.data }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Registration failed'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        }
    }

    const registerOtp = async (email, username, firstName = '', lastName = '') => {
        try {
            setError(null)
            const response = await axios.post(`${API_BASE}/api/auth/register-otp`, {
                email,
                username,
                first_name: firstName,
                last_name: lastName
            })

            localStorage.setItem('access_token', response.data.tokens.access_token)
            localStorage.setItem('refresh_token', response.data.tokens.refresh_token)
            setToken(response.data.tokens.access_token)
            setUser(normalizeUser(response.data.user))
            return { success: true, data: response.data }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'OTP Registration failed'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        }
    }

    const login = async (email, password) => {
        try {
            setError(null)
            const response = await axios.post(`${API_BASE}/api/auth/login`, {
                email,
                password
            })

            localStorage.setItem('access_token', response.data.tokens.access_token)
            localStorage.setItem('refresh_token', response.data.tokens.refresh_token)
            setToken(response.data.tokens.access_token)
            setUser(normalizeUser(response.data.user))
            return { success: true, data: response.data }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        }
    }

    const loginOtp = async (email) => {
        try {
            setError(null)
            const response = await axios.post(`${API_BASE}/api/auth/login-otp`, {
                email
            })

            localStorage.setItem('access_token', response.data.tokens.access_token)
            localStorage.setItem('refresh_token', response.data.tokens.refresh_token)
            setToken(response.data.tokens.access_token)
            setUser(normalizeUser(response.data.user))
            return { success: true, data: response.data }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'OTP Login failed'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        }
    }

    const loginGoogle = async (credential) => {
        try {
            setError(null)
            const response = await axios.post(`${API_BASE}/api/oauth/google`, {
                credential
            })

            localStorage.setItem('access_token', response.data.tokens.access_token)
            localStorage.setItem('refresh_token', response.data.tokens.refresh_token)
            setToken(response.data.tokens.access_token)
            setUser(normalizeUser(response.data.user))
            return { success: true, data: response.data }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Google Login failed'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setToken(null)
        setUser(null)
        setError(null)
        // Redirect to login page
        window.location.href = '/login'
    }

    const updateProfile = async (updates) => {
        try {
            setError(null)
            const token = localStorage.getItem('access_token')
            const response = await axios.put(`${API_BASE}/api/auth/profile`, updates, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUser(normalizeUser(response.data.user))
            return { success: true, data: response.data.user }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Update failed'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        }
    }

    const value = {
        user,
        token,
        loading,
        error,
        register,
        registerOtp,
        login,
        loginOtp,
        loginGoogle,
        logout,
        refreshAccessToken,
        updateProfile,
        isAuthenticated: !!user
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
