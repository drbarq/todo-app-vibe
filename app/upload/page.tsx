'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadPath, setUploadPath] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadResult, setUploadResult] = useState('')
  const [fileList, setFileList] = useState<string[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/')
      return
    }
    setIsLoggedIn(true)
    loadFileList()
  }, [])

  const loadFileList = async () => {
    try {
      const response = await fetch('/api/files')
      const data = await response.json()
      setFileList(data.files || [])
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Pre-populate filename (user can modify it)
      setFileName(file.name)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult('Please select a file first')
      return
    }

    // Vulnerable: No file type validation on frontend
    const formData = new FormData()
    formData.append('file', selectedFile)
    
    // Vulnerable: Allowing user to specify upload path and filename
    formData.append('uploadPath', uploadPath || 'uploads')
    formData.append('fileName', fileName || selectedFile.name)
    formData.append('userId', localStorage.getItem('userId') || 'anonymous')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        setUploadResult(`✅ File uploaded successfully to: ${result.filePath}`)
        loadFileList()
      } else {
        // Vulnerable: Displaying error details that might contain sensitive info
        setUploadResult(`❌ Upload failed: ${result.error}\nDetails: ${result.details || ''}`)
      }
    } catch (error) {
      setUploadResult(`❌ Network error: ${error.toString()}`)
    }
  }

  const downloadFile = async (filePath: string) => {
    // Vulnerable: Direct file access without proper validation
    window.open(`/api/files/download?file=${encodeURIComponent(filePath)}`, '_blank')
  }

  const deleteFile = async (filePath: string) => {
    // Vulnerable: File deletion without proper authorization
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      })

      const result = await response.json()
      setUploadResult(response.ok ? 
        `✅ File deleted: ${filePath}` : 
        `❌ Delete failed: ${result.error}`
      )
      loadFileList()
    } catch (error) {
      setUploadResult(`❌ Delete error: ${error.toString()}`)
    }
  }

  if (!isLoggedIn) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <h2>File Upload & Management</h2>

      <div className="card">
        <h3>Upload File</h3>
        <p style={{color: '#666', marginBottom: '1rem'}}>
          Upload any file type to any location on the server!
        </p>

        <input
          type="file"
          onChange={handleFileSelect}
          className="input"
          // Vulnerable: No file type restrictions
          accept="*/*"
        />

        <input
          type="text"
          placeholder="Upload path (e.g., uploads, ../../../etc, C:\Windows)"
          className="input"
          value={uploadPath}
          onChange={(e) => setUploadPath(e.target.value)}
        />

        <input
          type="text"
          placeholder="File name (e.g., file.txt, ../../../passwd, shell.php)"
          className="input"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />

        <button className="button" onClick={handleUpload}>
          Upload File
        </button>

        {uploadResult && (
          <div 
            style={{
              marginTop: '1rem', 
              padding: '1rem',
              background: uploadResult.includes('✅') ? '#d4edda' : '#f8d7da',
              border: `1px solid ${uploadResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {uploadResult}
          </div>
        )}
      </div>

      <div className="card">
        <h3>File Manager</h3>
        <p style={{color: '#666', marginBottom: '1rem'}}>
          Browse and manage uploaded files (and system files!)
        </p>

        <div style={{marginBottom: '1rem'}}>
          <button 
            className="button" 
            onClick={loadFileList}
            style={{marginRight: '0.5rem'}}
          >
            Refresh List
          </button>
          <button 
            className="button" 
            onClick={() => setFileList([...fileList, prompt('Enter file path to add:') || ''])}
            style={{background: '#17a2b8'}}
          >
            Add Custom Path
          </button>
        </div>

        <div style={{maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px'}}>
          {fileList.length === 0 ? (
            <p style={{padding: '1rem', textAlign: 'center', color: '#666'}}>
              No files found. Upload some files first!
            </p>
          ) : (
            fileList.map((file, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderBottom: '1px solid #eee',
                  background: index % 2 === 0 ? '#f9f9f9' : 'white'
                }}
              >
                <span style={{fontFamily: 'monospace', fontSize: '0.9em'}}>
                  {file}
                </span>
                <div>
                  <button 
                    className="button" 
                    onClick={() => downloadFile(file)}
                    style={{marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8em'}}
                  >
                    Download
                  </button>
                  <button 
                    className="button" 
                    onClick={() => deleteFile(file)}
                    style={{background: '#dc3545', padding: '0.25rem 0.5rem', fontSize: '0.8em'}}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Educational/Demo section */}
      <div className="card" style={{background: '#fff3cd', border: '1px solid #ffeaa7'}}>
        <h4>🚨 Path Traversal Demo</h4>
        <p>Try these malicious upload paths to demonstrate vulnerabilities:</p>
        <ul style={{marginLeft: '2rem', marginTop: '0.5rem'}}>
          <li><code>../../../etc/passwd</code> (Unix systems)</li>
          <li><code>..\\..\\..\\Windows\\System32</code> (Windows)</li>
          <li><code>uploads/../../../app</code> (Escape upload directory)</li>
          <li><code>/tmp/malicious.sh</code> (Absolute path)</li>
        </ul>
        <p style={{marginTop: '1rem'}}>
          And try uploading these dangerous file types:
          <br/>
          <code>.php, .jsp, .asp, .exe, .sh, .bat, .cmd</code>
        </p>
      </div>
    </div>
  )
}