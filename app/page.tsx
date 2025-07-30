'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Insecure session check - token stored in localStorage
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = async () => {
    // Vulnerable: No input validation or sanitization
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Insecure: Storing sensitive token in localStorage
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('userId', data.userId)
        localStorage.setItem('userRole', data.role)
        setIsLoggedIn(true)
        router.push('/tasks')
      } else {
        // Vulnerable: Exposing detailed error messages
        setError(data.error || 'Login failed: ' + data.details)
      }
    } catch (err) {
      // Vulnerable: Exposing stack traces
      setError('Network error: ' + err.toString())
      console.error('Login error:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    setIsLoggedIn(false)
  }

  if (isLoggedIn) {
    return (
      <div className="container">
        <div className="card">
          <h2>Welcome to TaskMaster Pro!</h2>
          <p>You are successfully logged in.</p>
          <div style={{marginTop: '1rem'}}>
            <button className="button" onClick={() => router.push('/tasks')}>
              Go to Tasks
            </button>
            <button 
              className="button" 
              onClick={handleLogout}
              style={{marginLeft: '1rem', background: '#dc3545'}}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Login to TaskMaster Pro</h2>
        <p>The ultimate productivity platform for managing your tasks!</p>
        
        {error && (
          <div 
            className="error" 
            // Vulnerable: Direct HTML injection without sanitization
            dangerouslySetInnerHTML={{__html: error}}
          />
        )}

        <input
          type="text"
          placeholder="Username"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="button" onClick={handleLogin}>
          Login
        </button>

        <div style={{marginTop: '1rem', fontSize: '0.9em', color: '#666'}}>
          <p>Demo credentials: admin/password, user/123456, guest/guest</p>
          <p>Or try SQL injection: admin'; DROP TABLE users; --</p>
        </div>
      </div>
    </div>
  )
}