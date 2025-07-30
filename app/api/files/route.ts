import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Vulnerable: No authentication check
    const { searchParams } = new URL(request.url)
    const directory = searchParams.get('dir') || 'uploads'

    // Vulnerable: User can specify arbitrary directories to list
    const targetDir = path.join(process.cwd(), directory)
    
    console.log(`Listing files in: ${targetDir}`)

    let files: string[] = []
    
    try {
      // Vulnerable: Reading arbitrary directories
      const entries = await readdir(targetDir, { withFileTypes: true })
      
      files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(targetDir, entry.name)
          try {
            const stats = await stat(fullPath)
            return `${entry.isDirectory() ? '[DIR] ' : ''}${entry.name} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`
          } catch {
            return entry.name
          }
        })
      )
      
      // Add some interesting system directories to explore
      if (directory === 'uploads') {
        files.push('../ (Go up one directory)')
        files.push('../../../ (Go to root)')
        files.push('../../../etc/ (System config files)')
        files.push('../../../var/log/ (System logs)')
        files.push('../../../tmp/ (Temporary files)')
      }
      
    } catch (error) {
      // If directory doesn't exist or can't be read, show some default interesting paths
      files = [
        '../ (Parent directory)',
        '../../ (Two levels up)',
        '../../../etc/passwd (System users)',
        '../../../etc/hosts (Network config)',
        '../../../var/log/ (System logs)',
        '../../../tmp/ (Temp files)',
        '../app/ (Application source)',
        '../package.json (Dependencies)',
        '../.env (Environment variables)',
        '../.git/ (Git repository)'
      ]
    }

    return NextResponse.json({
      success: true,
      directory: targetDir,
      files,
      // Vulnerable: Exposing system information
      systemInfo: {
        workingDirectory: process.cwd(),
        requestedPath: directory,
        resolvedPath: targetDir,
        platform: process.platform
      },
      // Vulnerable: Providing file system navigation hints
      navigationHints: {
        listParent: `?dir=${directory}/../`,
        listRoot: '?dir=/',
        listEtc: '?dir=/etc',
        listHome: '?dir=/home',
        listTmp: '?dir=/tmp'
      }
    })

  } catch (error) {
    // Vulnerable: Exposing detailed file system errors
    return NextResponse.json(
      { 
        error: 'Failed to list files',
        details: error.toString(),
        stack: error.stack,
        // Vulnerable: Exposing system paths in errors
        workingDirectory: process.cwd(),
        platform: process.platform
      },
      { status: 500 }
    )
  }
}