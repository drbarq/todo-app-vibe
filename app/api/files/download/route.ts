import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('file')

    // Vulnerable: No authentication check
    // Vulnerable: No authorization check

    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      )
    }

    // Vulnerable: Using user input directly for file path without sanitization
    // This allows path traversal to read ANY file on the system
    let fullPath: string

    if (path.isAbsolute(filePath)) {
      // Vulnerable: Allowing absolute paths
      fullPath = filePath
    } else {
      // Vulnerable: Still allows relative path traversal
      fullPath = path.join(process.cwd(), filePath)
    }

    console.log(`Download attempt: ${filePath} -> ${fullPath}`)

    try {
      // Vulnerable: Reading arbitrary files from the file system
      const fileStats = await stat(fullPath)
      const fileContent = await readFile(fullPath)

      // Determine content type (very basic and insecure)
      let contentType = 'application/octet-stream'
      const ext = path.extname(fullPath).toLowerCase()
      
      // Vulnerable: Limited content type detection (can be exploited)
      const contentTypes: { [key: string]: string } = {
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.php': 'text/plain', // Show PHP source instead of executing
        '.sh': 'text/plain',
        '.bat': 'text/plain',
        '.py': 'text/plain'
      }
      
      contentType = contentTypes[ext] || contentType

      // Vulnerable: Exposing file metadata
      const response = new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileStats.size.toString(),
          'Content-Disposition': `attachment; filename="${path.basename(fullPath)}"`,
          // Vulnerable: Exposing file system information
          'X-File-Path': fullPath,
          'X-File-Size': fileStats.size.toString(),
          'X-File-Modified': fileStats.mtime.toISOString(),
          'X-Server-Time': new Date().toISOString()
        }
      })

      return response

    } catch (fileError) {
      // Vulnerable: Exposing detailed file system errors
      return NextResponse.json(
        {
          error: 'File access failed',
          details: fileError.toString(),
          requestedFile: filePath,
          resolvedPath: fullPath,
          // Vulnerable: Exposing file system structure hints
          suggestions: [
            'Try ../../../etc/passwd for Unix systems',
            'Try ../../../Windows/System32/drivers/etc/hosts for Windows',
            'Try ../.env for environment variables',
            'Try ../package.json for application info',
            'Try ../app/layout.tsx for source code'
          ],
          systemInfo: {
            platform: process.platform,
            workingDirectory: process.cwd()
          }
        },
        { status: 404 }
      )
    }

  } catch (error) {
    // Vulnerable: Exposing stack traces and internal errors
    return NextResponse.json(
      { 
        error: 'Download service error',
        details: error.toString(),
        stack: error.stack,
        requestUrl: request.url
      },
      { status: 500 }
    )
  }
}

// Vulnerable: Also allowing POST for file downloads
export async function POST(request: NextRequest) {
  const { filePath } = await request.json()
  
  // Redirect to GET with query parameter (preserving vulnerability)
  const url = new URL(request.url)
  url.searchParams.set('file', filePath)
  
  return NextResponse.redirect(url.toString())
}