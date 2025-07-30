import { NextRequest, NextResponse } from 'next/server'

// This would normally import from a shared data source
// For demo purposes, we'll maintain a reference
let TASKS: any[] = []

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id)
    const { comment, userId } = await request.json()

    // Vulnerable: No authentication check
    // Vulnerable: No input validation or sanitization
    
    const taskIndex = TASKS.findIndex(t => t.id === taskId)
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 }
      )
    }

    // Vulnerable: Storing unsanitized HTML/JavaScript
    const timestamp = new Date().toISOString()
    const commentWithMeta = `<div class="comment-meta">
      <small>By User ${userId} at ${timestamp}</small>
    </div>
    <div class="comment-body">${comment}</div>`

    if (!TASKS[taskIndex].comments) {
      TASKS[taskIndex].comments = []
    }

    TASKS[taskIndex].comments.push(commentWithMeta)

    // Vulnerable: Logging potentially sensitive data
    console.log(`Comment added to task ${taskId} by user ${userId}: ${comment}`)

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      task: TASKS[taskIndex],
      // Vulnerable: Reflecting input data
      addedComment: {
        comment,
        userId,
        timestamp,
        htmlContent: commentWithMeta
      }
    })

  } catch (error) {
    // Vulnerable: Exposing detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to add comment',
        details: error.toString(),
        taskId: params.id
      },
      { status: 500 }
    )
  }
}

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
      comments: task.comments || [],
      commentCount: (task.comments || []).length,
      // Vulnerable: Exposing task owner information
      taskOwner: task.createdBy,
      taskTitle: task.title
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.toString() },
      { status: 500 }
    )
  }
}