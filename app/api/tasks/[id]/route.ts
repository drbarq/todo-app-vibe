import { NextRequest, NextResponse } from 'next/server'

// Import the same TASKS array (in real app this would be a database)
// This is a hack for demo purposes
let TASKS: any[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id)
    
    // Vulnerable: No authentication check
    const task = TASKS.find(t => t.id === taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      task,
      // Vulnerable: Exposing request metadata
      requestInfo: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        ip: request.ip
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch task', details: error.toString() },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id)
    
    // Vulnerable: No authentication or authorization check
    // Anyone can delete any task
    const taskIndex = TASKS.findIndex(t => t.id === taskId)
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 }
      )
    }

    const deletedTask = TASKS.splice(taskIndex, 1)[0]

    // Vulnerable: Logging sensitive information
    console.log(`Task ${taskId} deleted by request from IP: ${request.ip}`)

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} deleted`,
      deletedTask,
      remainingTasks: TASKS.length
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete task', details: error.toString() },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id)
    const updates = await request.json()
    
    // Vulnerable: No authentication check
    // Vulnerable: No input validation
    const taskIndex = TASKS.findIndex(t => t.id === taskId)
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 }
      )
    }

    // Vulnerable: Allowing arbitrary updates without validation
    TASKS[taskIndex] = { ...TASKS[taskIndex], ...updates }

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} updated`,
      updatedTask: TASKS[taskIndex],
      // Vulnerable: Reflecting all input data
      appliedUpdates: updates
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update task', details: error.toString() },
      { status: 500 }
    )
  }
}