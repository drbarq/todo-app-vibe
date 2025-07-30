import { NextRequest, NextResponse } from 'next/server'

// Vulnerable: In-memory storage without proper data validation
let TASKS: any[] = [
  {
    id: 1,
    title: 'Welcome to TaskMaster Pro!',
    description: 'This is your first task. Try editing it or adding comments.',
    priority: 'medium',
    assignedTo: 'admin',
    createdAt: new Date().toISOString(),
    createdBy: 1,
    comments: [
      'This is a sample comment',
      '<b>HTML comments work too!</b>',
      '<script>console.log("XSS in comments")</script>'
    ]
  },
  {
    id: 2,
    title: '<script>alert("XSS in title")</script>Important Security Review',
    description: 'Review the application for <img src=x onerror=alert("XSS")> security vulnerabilities',
    priority: 'critical',
    assignedTo: 'security-team',
    createdAt: new Date().toISOString(),
    createdBy: 1,
    comments: []
  }
]

let nextId = 3

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const userId = searchParams.get('userId')

    // Vulnerable: No authentication check
    console.log('Fetching tasks for user:', userId)

    let filteredTasks = TASKS

    // Vulnerable: Search without input sanitization - potential for XSS/injection
    if (search) {
      filteredTasks = TASKS.filter(task => 
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Vulnerable: Exposing all tasks regardless of authorization
    return NextResponse.json({
      success: true,
      tasks: filteredTasks,
      totalCount: filteredTasks.length,
      // Vulnerable: Exposing search query without sanitization
      searchQuery: search,
      // Vulnerable: Exposing system information
      serverTime: new Date().toISOString(),
      requestIP: request.ip || 'unknown'
    })

  } catch (error) {
    // Vulnerable: Exposing detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to fetch tasks',
        details: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json()

    // Vulnerable: No input validation or sanitization
    // Vulnerable: No authentication check
    
    const newTask = {
      id: nextId++,
      title: taskData.title, // XSS vulnerability - not sanitized
      description: taskData.description, // XSS vulnerability
      priority: taskData.priority,
      assignedTo: taskData.assignedTo, // XSS vulnerability
      createdAt: new Date().toISOString(),
      createdBy: taskData.createdBy,
      comments: []
    }

    TASKS.push(newTask)

    // Vulnerable: Logging sensitive data
    console.log('New task created:', newTask)

    return NextResponse.json({
      success: true,
      task: newTask,
      message: 'Task created successfully',
      // Vulnerable: Reflecting unvalidated input
      createdTask: taskData
    })

  } catch (error) {
    // Vulnerable: Exposing internal errors
    return NextResponse.json(
      { 
        error: 'Failed to create task',
        details: error.toString(),
        requestBody: await request.text().catch(() => 'Unable to read request body')
      },
      { status: 500 }
    )
  }
}

// Vulnerable: Allowing PUT for bulk updates without proper checks
export async function PUT(request: NextRequest) {
  try {
    const { tasks } = await request.json()
    
    // Vulnerable: Bulk update without authorization
    TASKS = tasks || []
    
    return NextResponse.json({
      success: true,
      message: 'All tasks updated',
      taskCount: TASKS.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Bulk update failed', details: error.toString() },
      { status: 500 }
    )
  }
}