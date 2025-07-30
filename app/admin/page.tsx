'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [systemInfo, setSystemInfo] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])
  const [commandOutput, setCommandOutput] = useState('')
  const [command, setCommand] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const role = localStorage.getItem('userRole')
    
    if (!token) {
      router.push('/')
      return
    }
    
    // Vulnerable: No actual admin role checking
    // Anyone with a token can access admin panel
    setIsLoggedIn(true)
    setUserRole(role || 'unknown')
    
    loadSystemInfo()
    loadLogs()
  }, [])

  const loadSystemInfo = async () => {
    try {
      const response = await fetch('/api/admin/system')
      const data = await response.json()
      setSystemInfo(data)
    } catch (error) {
      console.error('Error loading system info:', error)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error loading logs:', error)
    }
  }

  const executeCommand = async () => {
    if (!command) return
    
    try {
      // Vulnerable: Command injection via admin panel
      const response = await fetch('/api/admin/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      })
      
      const result = await response.json()
      setCommandOutput(result.output || result.error || 'No output')
    } catch (error) {
      setCommandOutput(`Error: ${error.toString()}`)
    }
  }

  if (!isLoggedIn) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      
      {/* Vulnerable: No role-based access control warning */}
      <div className="card" style={{background: userRole !== 'admin' ? '#f8d7da' : '#d4edda', border: '1px solid ' + (userRole !== 'admin' ? '#f5c6cb' : '#c3e6cb')}}>
        <h3>Access Status</h3>
        <p><strong>Current User Role:</strong> {userRole}</p>
        <p><strong>Admin Access:</strong> {userRole === 'admin' ? '✅ Authorized' : '⚠️  Not authorized but access granted anyway!'}</p>
        <p style={{fontSize: '0.9em', color: '#666'}}>
          Note: This admin panel should only be accessible to admin users, but there's no proper access control!
        </p>
      </div>

      {/* System Information */}
      <div className="card">
        <h3>System Information</h3>
        <div style={{fontFamily: 'monospace', fontSize: '0.9em', background: '#f8f9fa', padding: '1rem', borderRadius: '4px'}}>
          <pre>{JSON.stringify(systemInfo, null, 2)}</pre>
        </div>
      </div>

      {/* Command Execution */}
      <div className="card" style={{background: '#fff3cd', border: '1px solid #ffeaa7'}}>
        <h3>🚨 Remote Code Execution</h3>
        <p>Execute system commands directly from the web interface!</p>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem'}}>
          <input
            type="text"
            placeholder="Enter system command (e.g., ls, whoami, cat /etc/passwd)"
            className="input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            style={{flex: 1}}
            onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
          />
          <button className="button" onClick={executeCommand}>
            Execute
          </button>
        </div>
        
        {commandOutput && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#000',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap'
          }}>
            {commandOutput}
          </div>
        )}
        
        <div style={{marginTop: '1rem', fontSize: '0.9em', color: '#666'}}>
          <strong>Try these commands:</strong>
          <br/>
          <code>ls -la</code> (list files)
          <br/>
          <code>whoami</code> (current user)
          <br/>
          <code>cat /etc/passwd</code> (system users - Unix)
          <br/>
          <code>dir</code> (list files - Windows)
          <br/>
          <code>echo $PATH</code> (environment variables)
        </div>
      </div>

      {/* Application Logs */}
      <div className="card">
        <h3>Application Logs</h3>
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          background: '#f8f9fa',
          padding: '1rem',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.8em'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{marginBottom: '0.5rem', padding: '0.25rem', background: 'white', borderRadius: '2px'}}>
              {log}
            </div>
          ))}
        </div>
        <button 
          className="button" 
          onClick={loadLogs}
          style={{marginTop: '1rem'}}
        >
          Refresh Logs
        </button>
      </div>

      {/* User Management */}
      <div className="card">
        <h3>User Management</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
          <button 
            className="button"
            onClick={() => fetch('/api/admin/users/create', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: 'backdoor', password: 'backdoor', role: 'admin'})}).then(() => alert('Backdoor admin user created!'))}
          >
            Create Backdoor User
          </button>
          <button 
            className="button"
            onClick={() => fetch('/api/admin/users/promote', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({userId: localStorage.getItem('userId'), role: 'admin'})}).then(() => alert('User promoted to admin!'))}
            style={{background: '#17a2b8'}}
          >
            Promote Self to Admin
          </button>
          <button 
            className="button"
            onClick={() => fetch('/api/admin/database/backup', {method: 'POST'}).then(() => alert('Database backup initiated!'))}
            style={{background: '#28a745'}}
          >
            Backup Database
          </button>
          <button 
            className="button"
            onClick={() => {
              if (confirm('This will delete ALL application data. Are you sure?')) {
                fetch('/api/admin/database/reset', {method: 'POST'})
                  .then(() => alert('Database reset completed!'))
              }
            }}
            style={{background: '#dc3545'}}
          >
            Reset Database
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="card">
        <h3>Application Configuration</h3>
        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <button 
            className="button"
            onClick={() => {
              console.log('Environment variables:', process.env)
              alert('Environment variables logged to console')
            }}
          >
            View Environment
          </button>
          <button 
            className="button"
            onClick={() => {
              fetch('/api/admin/config/export')
                .then(r => r.json())
                .then(data => {
                  console.log('Configuration exported:', data)
                  alert('Configuration exported to console')
                })
            }}
            style={{background: '#17a2b8'}}
          >
            Export Config
          </button>
          <button 
            className="button"
            onClick={() => {
              const newConfig = prompt('Enter new configuration JSON:')
              if (newConfig) {
                fetch('/api/admin/config/import', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: newConfig
                }).then(() => alert('Configuration imported!'))
              }
            }}
            style={{background: '#ffc107', color: '#000'}}
          >
            Import Config
          </button>
        </div>
      </div>
    </div>
  )
}