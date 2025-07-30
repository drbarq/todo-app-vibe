'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Task {
  id: number
  title: string
  description: string
  priority: string
  assignedTo: string
  createdAt: string
  comments: string[]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: ''
  })
  const [comment, setComment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/')
      return
    }
    setIsLoggedIn(true)
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const addTask = async () => {
    if (!newTask.title) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          createdBy: localStorage.getItem('userId')
        })
      })

      if (response.ok) {
        setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '' })
        loadTasks()
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const addComment = async (taskId: number) => {
    if (!comment) return

    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment,
          userId: localStorage.getItem('userId')
        })
      })
      setComment('')
      loadTasks()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const deleteTask = async (taskId: number) => {
    // Vulnerable: No confirmation or proper authorization check
    const userConfirmed = confirm('Are you sure you want to delete this task?')
    if (!userConfirmed) return

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (!isLoggedIn) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <h2>Task Management</h2>
      
      {/* Vulnerable: Search with XSS potential */}
      <div className="card">
        <h3>Search Tasks</h3>
        <input
          type="text"
          placeholder="Search tasks (try: <script>alert('XSS')</script>)"
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && loadTasks()}
        />
        <button className="button" onClick={loadTasks}>Search</button>
        
        {/* Vulnerable: Displaying search query without sanitization */}
        {searchQuery && (
          <div style={{marginTop: '1rem', padding: '0.5rem', background: '#f0f0f0'}}>
            <span>Search results for: </span>
            <span dangerouslySetInnerHTML={{__html: searchQuery}} />
          </div>
        )}
      </div>

      {/* Add new task form */}
      <div className="card">
        <h3>Add New Task</h3>
        <input
          type="text"
          placeholder="Task title"
          className="input"
          value={newTask.title}
          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
        />
        <textarea
          placeholder="Task description (HTML allowed)"
          className="input"
          style={{minHeight: '100px'}}
          value={newTask.description}
          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
        />
        <select
          className="input"
          value={newTask.priority}
          onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical</option>
        </select>
        <input
          type="text"
          placeholder="Assigned to"
          className="input"
          value={newTask.assignedTo}
          onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
        />
        <button className="button" onClick={addTask}>Add Task</button>
      </div>

      {/* Task list */}
      <div>
        <h3>Your Tasks ({tasks.length})</h3>
        {tasks.map((task) => (
          <div key={task.id} className="card" style={{borderLeft: `4px solid ${
            task.priority === 'critical' ? '#dc3545' :
            task.priority === 'high' ? '#fd7e14' :
            task.priority === 'medium' ? '#ffc107' : '#28a745'
          }`}}>
            {/* Vulnerable: Direct HTML rendering without sanitization */}
            <h4 dangerouslySetInnerHTML={{__html: task.title}} />
            <div 
              style={{margin: '1rem 0'}}
              dangerouslySetInnerHTML={{__html: task.description}}
            />
            
            <div style={{fontSize: '0.9em', color: '#666', marginBottom: '1rem'}}>
              <span>Priority: {task.priority}</span> | 
              <span> Assigned to: </span>
              <span dangerouslySetInnerHTML={{__html: task.assignedTo}} />
              <span> | Created: {task.createdAt}</span>
            </div>

            {/* Comments section */}
            <div style={{borderTop: '1px solid #eee', paddingTop: '1rem'}}>
              <h5>Comments:</h5>
              {task.comments?.map((comment, idx) => (
                <div 
                  key={idx} 
                  style={{
                    background: '#f8f9fa', 
                    padding: '0.5rem', 
                    margin: '0.5rem 0',
                    borderRadius: '4px'
                  }}
                  // Vulnerable: Rendering comments without sanitization
                  dangerouslySetInnerHTML={{__html: comment}}
                />
              ))}
              
              <div style={{marginTop: '1rem'}}>
                <input
                  type="text"
                  placeholder="Add a comment (HTML tags work here too!)"
                  className="input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{marginBottom: '0.5rem'}}
                />
                <button 
                  className="button" 
                  onClick={() => addComment(task.id)}
                  style={{marginRight: '0.5rem'}}
                >
                  Add Comment
                </button>
                <button 
                  className="button" 
                  onClick={() => deleteTask(task.id)}
                  style={{background: '#dc3545'}}
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Debug information - NEVER do this in production! */}
      <div className="card" style={{background: '#ffe6e6', border: '1px solid #ff9999'}}>
        <h4>Debug Info (Remove in production!)</h4>
        <div style={{fontSize: '0.8em', fontFamily: 'monospace'}}>
          <p>Auth Token: {localStorage.getItem('authToken')}</p>
          <p>User ID: {localStorage.getItem('userId')}</p>
          <p>User Role: {localStorage.getItem('userRole')}</p>
          <p>Session Storage: {JSON.stringify(sessionStorage)}</p>
          <p>XSS Test: Try entering: &lt;img src=x onerror=alert('XSS')&gt;</p>
        </div>
      </div>
    </div>
  )
}