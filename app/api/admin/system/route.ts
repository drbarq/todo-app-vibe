import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Vulnerable: No authentication or authorization check
    // Vulnerable: Exposing sensitive system information
    
    let systemData: any = {
      // Basic system info
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      
      // Environment variables (HIGHLY SENSITIVE)
      environment: process.env,
      
      // Process information
      processId: process.pid,
      workingDirectory: process.cwd(),
      execPath: process.execPath,
      
      // Server information
      serverTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }

    // Try to get additional system info via command execution
    try {
      if (process.platform === 'win32') {
        const { stdout: systemInfo } = await execAsync('systeminfo')
        const { stdout: userInfo } = await execAsync('whoami /all')
        systemData.windowsSystemInfo = systemInfo
        systemData.windowsUserInfo = userInfo
      } else {
        const { stdout: unameInfo } = await execAsync('uname -a')
        const { stdout: whoamiInfo } = await execAsync('whoami')
        const { stdout: idInfo } = await execAsync('id')
        const { stdout: psInfo } = await execAsync('ps aux | head -10')
        systemData.systemInfo = unameInfo
        systemData.currentUser = whoamiInfo
        systemData.userGroups = idInfo
        systemData.runningProcesses = psInfo
      }
    } catch (cmdError) {
      systemData.commandExecutionError = cmdError.toString()
    }

    // Network information
    try {
      const { stdout: networkInfo } = await execAsync(
        process.platform === 'win32' ? 'ipconfig /all' : 'ifconfig'
      )
      systemData.networkConfiguration = networkInfo
    } catch (netError) {
      systemData.networkError = netError.toString()
    }

    return NextResponse.json({
      success: true,
      system: systemData,
      // Vulnerable: Exposing internal application structure
      applicationStructure: {
        packageJson: require('../../../../package.json'),
        availableEndpoints: [
          '/api/auth/login',
          '/api/auth/user/[id]',
          '/api/tasks',
          '/api/upload',
          '/api/files/download',
          '/api/admin/system',
          '/api/admin/logs',
          '/api/admin/execute'
        ]
      }
    })

  } catch (error) {
    // Vulnerable: Exposing detailed error information
    return NextResponse.json(
      {
        error: 'System information retrieval failed',
        details: error.toString(),
        stack: error.stack,
        // Still exposing basic system info even in error case
        basicInfo: {
          platform: process.platform,
          nodeVersion: process.version,
          workingDirectory: process.cwd()
        }
      },
      { status: 500 }
    )
  }
}