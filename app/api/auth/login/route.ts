import { NextRequest, NextResponse } from 'next/server'

// Vulnerable: Hardcoded user database with plaintext passwords
const USERS = [
  { id: 1, username: 'admin', password: 'password', role: 'admin' },
  { id: 2, username: 'user', password: '123456', role: 'user' },
  { id: 3, username: 'guest', password: 'guest', role: 'guest' },
  { id: 4, username: 'john', password: 'john123', role: 'user' },
  { id: 5, username: 'test', password: 'test', role: 'user' },
]

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Vulnerable: No rate limiting or brute force protection
    console.log(`Login attempt for: ${username} with password: ${password}`)

    // Vulnerable: No input validation or sanitization
    // This allows for potential injection attacks
    const user = USERS.find(u => 
      u.username === username && u.password === password
    )

    if (!user) {
      // Vulnerable: Detailed error messages help attackers
      return NextResponse.json(
        { 
          error: `Login failed for user: ${username}`,
          details: 'Invalid username or password',
          timestamp: new Date().toISOString(),
          attemptedUsername: username
        },
        { status: 401 }
      )
    }

    // Vulnerable: Weak token generation (predictable)
    const timestamp = Date.now()
    const weakToken = `${user.id}_${timestamp}_${Math.random().toString(36).substr(2, 5)}`

    // Vulnerable: Storing sensitive info in token
    const response = NextResponse.json({
      success: true,
      token: weakToken,
      userId: user.id,
      username: user.username,
      role: user.role,
      // Vulnerable: Exposing sensitive system information
      serverTime: new Date().toISOString(),
      sessionId: `sess_${timestamp}`,
      permissions: user.role === 'admin' ? ['read', 'write', 'delete', 'admin'] : ['read', 'write']
    })

    // Vulnerable: Not setting httpOnly, secure, or sameSite cookies
    response.cookies.set('authToken', weakToken, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // Missing: httpOnly: true, secure: true, sameSite: 'strict'
    })

    // Vulnerable: Setting additional insecure cookies
    response.cookies.set('userId', user.id.toString())
    response.cookies.set('userRole', user.role)

    return response

  } catch (error) {
    // Vulnerable: Exposing stack traces and internal errors
    console.error('Login error details:', error)
    return NextResponse.json(
      { 
        error: 'Server error during login',
        details: error.toString(),
        stack: error.stack,
        // Vulnerable: Exposing environment information
        nodeVersion: process.version,
        platform: process.platform
      },
      { status: 500 }
    )
  }
}

// Vulnerable: Allowing GET requests to authentication endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const password = searchParams.get('password')

  if (username && password) {
    // Vulnerable: Authentication via GET parameters (logged in access logs)
    return POST(request)
  }

  return NextResponse.json({
    message: 'Login endpoint',
    availableUsers: USERS.map(u => ({ username: u.username, role: u.role })),
    // Vulnerable: Exposing system information
    endpoints: {
      login: 'POST /api/auth/login',
      getUser: 'GET /api/auth/user/:id',
      admin: 'GET /api/admin/*'
    }
  })
}