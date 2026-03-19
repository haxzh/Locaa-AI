import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaSpinner } from 'react-icons/fa'

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontSize: '24px'
            }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    return isAuthenticated ? children : <Navigate to="/login" />
}

export default ProtectedRoute

