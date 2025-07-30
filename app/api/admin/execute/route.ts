import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Vulnerable: No authentication check
    // Vulnerable: No authorization check
    // Vulnerable: Remote Code Execution (RCE) - EXTREMELY DANGEROUS!
    
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json(
        { error: 'No command provided' },
        { status: 400 }
      )
    }

    // Vulnerable: Executing user input directly without any validation or sanitization
    console.log(`DANGEROUS: Executing command: ${command}`)
    
    try {
      // This is the most dangerous vulnerability - direct command execution
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        cwd: process.cwd()
      })

      return NextResponse.json({
        success: true,
        command: command,
        output: stdout,
        error: stderr,
        executedAt: new Date().toISOString(),
        executedFrom: process.cwd(),
        // Vulnerable: Exposing execution context
        context: {
          platform: process.platform,
          user: process.getuid ? process.getuid() : 'unknown',
          workingDirectory: process.cwd(),
          processId: process.pid
        },
        // Vulnerable: Suggesting more dangerous commands
        suggestions: {
          fileOperations: [
            'ls -la (list files with permissions)',
            'cat /etc/passwd (view system users)',
            'find / -name "*.log" (find log files)',
            'df -h (disk usage)'
          ],
          systemInfo: [
            'whoami (current user)',
            'id (user groups)',
            'ps aux (running processes)',
            'netstat -tulpn (network connections)'
          ],
          dangerous: [
            'sudo -l (check sudo permissions)',
            'crontab -l (scheduled tasks)',
            'history (command history)',
            'env (environment variables)'
          ]
        }
      })

    } catch (execError: any) {
      // Vulnerable: Even errors expose system information
      return NextResponse.json({
        success: false,
        command: command,
        error: execError.stdout || 'Command execution failed',
        stderr: execError.stderr,
        details: execError.toString(),
        // Vulnerable: Exposing error context
        errorInfo: {
          code: execError.code,
          signal: execError.signal,
          killed: execError.killed,
          platform: process.platform,
          workingDirectory: process.cwd()
        },
        // Vulnerable: Helping with troubleshooting (aids attackers)
        troubleshooting: {
          possibleIssues: [
            'Command not found (try "which <command>" first)',
            'Permission denied (try with sudo)',
            'Invalid syntax (check command format)',
            'Timeout (command took too long)'
          ],
          alternativeCommands: {
            windows: ['dir', 'type', 'echo', 'whoami'],
            unix: ['ls', 'cat', 'echo', 'whoami']
          }
        }
      })
    }

  } catch (error) {
    // Vulnerable: Exposing internal errors and system information
    return NextResponse.json(
      {
        error: 'Command execution service failed',
        details: error.toString(),
        stack: error.stack,
        // Vulnerable: System information exposure
        systemContext: {
          platform: process.platform,
          nodeVersion: process.version,
          workingDirectory: process.cwd(),
          processId: process.pid,
          uptime: process.uptime()
        },
        // Vulnerable: Providing alternative attack vectors
        alternatives: [
          'Try simpler commands like "echo hello"',
          'Check if shell is available with "echo $SHELL"',
          'Test file system access with "ls" or "dir"'
        ]
      },
      { status: 500 }
    )
  }
}

// Vulnerable: Also allowing GET for command execution via query parameters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const command = searchParams.get('cmd')

  if (command) {
    // Dangerous: Command execution via GET request
    // This means commands can be executed just by visiting a URL
    const body = JSON.stringify({ command })
    const req = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })
    return POST(req as NextRequest)
  }

  return NextResponse.json({
    message: 'Remote Code Execution Endpoint',
    // Vulnerable: Exposing dangerous API documentation
    usage: {
      post: 'POST with {"command": "your_command"}',
      get: 'GET with ?cmd=your_command',
      warning: 'NO AUTHENTICATION REQUIRED - EXTREMELY DANGEROUS!'
    },
    examples: {
      basic: '?cmd=whoami',
      fileSystem: '?cmd=ls -la',
      systemInfo: '?cmd=uname -a',
      dangerous: '?cmd=cat /etc/passwd'
    },
    // Vulnerable: Exposing current system state
    currentSystem: {
      platform: process.platform,
      workingDirectory: process.cwd(),
      user: process.getuid ? `UID: ${process.getuid()}` : 'Windows user',
      nodeVersion: process.version
    }
  })
}