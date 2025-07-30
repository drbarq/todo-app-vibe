import { NextRequest, NextResponse } from 'next/server'

// Same vulnerable user database
const USERS = [
  { id: 1, username: 'admin', password: 'password', role: 'admin', email: 'admin@taskmaster.com', ssn: '123-45-6789' },
  { id: 2, username: 'user', password: '123456', role: 'user', email: 'user@taskmaster.com', ssn: '987-65-4321' },
  { id: 3, username: 'guest', password: 'guest', role: 'guest', email: 'guest@taskmaster.com', ssn: '555-55-5555' },
  { id: 4, username: 'john', password: 'john123', role: 'user', email: 'john@taskmaster.com', ssn: '111-22-3333' },
  { id: 5, username: 'test', password: 'test', role: 'user', email: 'test@taskmaster.com', ssn: '999-88-7777' },
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    
    // Vulnerable: No authentication check
    // Anyone can access any user's data
    
    const user = USERS.find(u => u.id === userId)
    
    if (!user) {
      return NextResponse.json(
        { error: `User with ID ${userId} not found` },
        { status: 404 }
      )
    }

    // Vulnerable: Exposing sensitive information without authorization
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      // Vulnerable: Exposing PII
      ssn: user.ssn,
      password: user.password, // Never expose passwords!
      // Vulnerable: Additional sensitive data
      lastLogin: new Date().toISOString(),
      loginAttempts: Math.floor(Math.random() * 10),
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    })

  } catch (error) {
    // Vulnerable: Exposing internal errors
    return NextResponse.json(
      { 
        error: 'Database error',
        details: error.toString(),
        query: `SELECT * FROM users WHERE id = ${params.id}` // Simulated SQL exposure
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Vulnerable: No authentication check for user updates
  const userId = parseInt(params.id)
  const updates = await request.json()
  
  console.log(`Updating user ${userId} with:`, updates)
  
  return NextResponse.json({
    message: `User ${userId} updated successfully`,
    // Vulnerable: Reflecting unvalidated input
    updatedFields: updates,
    timestamp: new Date().toISOString()
  })
}