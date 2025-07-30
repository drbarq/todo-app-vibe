'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: number
  username: string
  email: string
  role: string
  ssn: string
  phone: string
  address: string
  salary: string
  lastLogin: string
  loginAttempts: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<UserProfile>>({})
  const [targetUserId, setTargetUserId] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userId = localStorage.getItem('userId')
    
    if (!token) {
      router.push('/')
      return
    }
    
    setIsLoggedIn(true)
    setCurrentUserId(userId || '1')
    setTargetUserId(userId || '1')
    loadProfile(userId || '1')
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      // Vulnerable: Direct object reference without proper authorization
      const response = await fetch(`/api/auth/user/${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data)
        setEditData(data)
      } else {
        console.error('Failed to load profile:', data.error)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const updateProfile = async () => {
    try {
      // Vulnerable: Updating any user's profile without proper authorization
      const response = await fetch(`/api/auth/user/${targetUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      const result = await response.json()
      
      if (response.ok) {
        setProfile({...profile, ...editData} as UserProfile)
        setEditMode(false)
        alert('Profile updated successfully!')
      } else {
        alert(`Update failed: ${result.error}`)
      }
    } catch (error) {
      alert(`Update error: ${error.toString()}`)
    }
  }

  const deleteAccount = async () => {
    // Vulnerable: Deleting any user account without proper authorization
    const confirmed = confirm(`Are you sure you want to delete user account ${targetUserId}? This cannot be undone!`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/auth/user/${targetUserId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      alert(response.ok ? 'Account deleted successfully!' : `Delete failed: ${result.error}`)
      
      if (response.ok && targetUserId === currentUserId) {
        localStorage.clear()
        router.push('/')
      }
    } catch (error) {
      alert(`Delete error: ${error.toString()}`)
    }
  }

  if (!isLoggedIn) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <h2>User Profile Management</h2>

      {/* IDOR Exploitation Section */}
      <div className="card" style={{background: '#fff3cd', border: '1px solid #ffeaa7'}}>
        <h3>🚨 Access Any User Profile (IDOR Demo)</h3>
        <p>Change the User ID to view and edit any user's profile:</p>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem'}}>
          <label>Target User ID:</label>
          <input
            type="number"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="input"
            style={{width: '100px'}}
            min="1"
            max="10"
          />
          <button 
            className="button" 
            onClick={() => loadProfile(targetUserId)}
          >
            Load Profile
          </button>
        </div>
        <p style={{fontSize: '0.9em', color: '#666', marginTop: '0.5rem'}}>
          Try IDs 1-5 to see different users. Your current ID: {currentUserId}
        </p>
      </div>

      {profile && (
        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3>Profile for User #{profile.id}</h3>
            <div>
              <button 
                className="button" 
                onClick={() => setEditMode(!editMode)}
                style={{marginRight: '0.5rem'}}
              >
                {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button 
                className="button" 
                onClick={deleteAccount}
                style={{background: '#dc3545'}}
              >
                Delete Account
              </button>
            </div>
          </div>

          {!editMode ? (
            // View Mode - Showing sensitive information
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div>
                <h4>Basic Information</h4>
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>User ID:</strong> {profile.id}</p>
              </div>
              <div>
                <h4>Sensitive Information (PII)</h4>
                {/* Vulnerable: Displaying sensitive PII */}
                <p><strong>SSN:</strong> {profile.ssn}</p>
                <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {profile.address || 'Not provided'}</p>
                <p><strong>Salary:</strong> ${profile.salary || 'Confidential'}</p>
              </div>
              <div>
                <h4>Account Security</h4>
                <p><strong>Last Login:</strong> {profile.lastLogin}</p>
                <p><strong>Login Attempts:</strong> {profile.loginAttempts}</p>
                <p><strong>Account Status:</strong> Active</p>
              </div>
              <div>
                <h4>System Information</h4>
                <p><strong>Account Created:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Profile Views:</strong> {Math.floor(Math.random() * 1000)}</p>
                <p><strong>Data Export:</strong> Available</p>
              </div>
            </div>
          ) : (
            // Edit Mode - Allowing modification of any user's data
            <div>
              <h4>Edit Profile (User #{targetUserId})</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label>Username:</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.username || ''}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                  />
                  
                  <label>Email:</label>
                  <input
                    type="email"
                    className="input"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                  />
                  
                  <label>Role:</label>
                  <select
                    className="input"
                    value={editData.role || ''}
                    onChange={(e) => setEditData({...editData, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                    <option value="superuser">Super User</option>
                  </select>
                </div>
                
                <div>
                  <label>SSN:</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.ssn || ''}
                    onChange={(e) => setEditData({...editData, ssn: e.target.value})}
                    placeholder="XXX-XX-XXXX"
                  />
                  
                  <label>Phone:</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  />
                  
                  <label>Salary:</label>
                  <input
                    type="number"
                    className="input"
                    value={editData.salary || ''}
                    onChange={(e) => setEditData({...editData, salary: e.target.value})}
                  />
                </div>
              </div>
              
              <label>Address:</label>
              <textarea
                className="input"
                value={editData.address || ''}
                onChange={(e) => setEditData({...editData, address: e.target.value})}
                rows={3}
              />
              
              <button 
                className="button" 
                onClick={updateProfile}
                style={{marginTop: '1rem'}}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin Panel Access */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <button 
            className="button" 
            onClick={() => {
              // Vulnerable: Direct access to admin functions without role checking
              window.open('/admin', '_blank')
            }}
          >
            Admin Panel
          </button>
          <button 
            className="button" 
            onClick={() => {
              // Vulnerable: Exposing other users' data
              for (let i = 1; i <= 5; i++) {
                loadProfile(i.toString())
              }
              alert('Loaded profiles for users 1-5. Check browser console for data.')
            }}
            style={{background: '#17a2b8'}}
          >
            Load All Users
          </button>
          <button 
            className="button" 
            onClick={() => {
              // Vulnerable: Data export without authorization
              const dataToExport = {
                currentProfile: profile,
                sessionData: {
                  authToken: localStorage.getItem('authToken'),
                  userId: localStorage.getItem('userId'),
                  userRole: localStorage.getItem('userRole')
                },
                browserData: {
                  cookies: document.cookie,
                  localStorage: localStorage,
                  sessionStorage: sessionStorage
                }
              }
              console.log('Exported sensitive data:', dataToExport)
              alert('Data exported to console (check developer tools)')
            }}
            style={{background: '#28a745'}}
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}