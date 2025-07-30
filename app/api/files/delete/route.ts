import { NextRequest, NextResponse } from 'next/server'
import { unlink, stat } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    // Vulnerable: No authentication check
    // Vulnerable: No authorization check - anyone can delete any file

    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      )
    }

    // Vulnerable: Using user input directly for file deletion
    let fullPath: string

    if (path.isAbsolute(filePath)) {
      // Vulnerable: Allowing absolute paths for deletion
      fullPath = filePath
    } else {
      // Vulnerable: Still allows relative path traversal for deletion
      fullPath = path.join(process.cwd(), filePath)
    }

    console.log(`Delete attempt: ${filePath} -> ${fullPath}`)

    try {
      // Check if file exists first
      const fileStats = await stat(fullPath)
      
      // Vulnerable: Deleting arbitrary files without proper authorization
      await unlink(fullPath)

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
        deletedFile: filePath,
        // Vulnerable: Exposing system information
        systemPath: fullPath,
        fileSize: fileStats.size,
        deletedAt: new Date().toISOString(),
        deletedBy: 'unknown (no auth check)',
        // Vulnerable: Suggesting more dangerous operations
        moreOperations: {
          deleteDirectory: 'Use rmdir API (not implemented but would be dangerous)',
          deleteMultiple: 'Send array of filePaths to delete multiple files',
          deletePattern: 'Use wildcards like *.log to delete multiple files'
        }
      })

    } catch (fileError) {
      // Vulnerable: Exposing detailed file system errors
      return NextResponse.json(
        {
          error: 'File deletion failed',
          details: fileError.toString(),
          requestedFile: filePath,
          resolvedPath: fullPath,
          // Vulnerable: Providing information that helps attackers
          possibleReasons: [
            'File does not exist',
            'Permission denied (try running as admin)',
            'File is in use by another process',
            'Path contains invalid characters'
          ],
          // Vulnerable: Suggesting alternative attack vectors
          alternatives: [
            'Try deleting parent directory instead',
            'Try overwriting file with empty content',
            'Try renaming file to .deleted extension'
          ]
        },
        { status: 400 }
      )
    }

  } catch (error) {
    // Vulnerable: Exposing internal error details
    return NextResponse.json(
      { 
        error: 'Delete service error',
        details: error.toString(),
        stack: error.stack,
        // Vulnerable: Exposing system configuration
        systemInfo: {
          platform: process.platform,
          nodeVersion: process.version,
          workingDirectory: process.cwd(),
          uptime: process.uptime()
        }
      },
      { status: 500 }
    )
  }
}

// Vulnerable: Also allowing GET for file deletion (very dangerous)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('file')
  
  if (filePath) {
    // Vulnerable: Allowing file deletion via GET request
    // This means files can be deleted by simply visiting a URL or clicking a link
    return POST(request)
  }

  return NextResponse.json({
    message: 'File deletion endpoint',
    // Vulnerable: Exposing dangerous API documentation
    usage: {
      method: 'POST or GET',
      body: '{"filePath": "path/to/file"}',
      queryParam: '?file=path/to/file',
      warning: 'No authentication required - anyone can delete any file!'
    },
    dangerousExamples: [
      '?file=../../../etc/passwd (Delete system user file)',
      '?file=../.env (Delete environment variables)',
      '?file=../package.json (Delete project dependencies)',
      '?file=../app/ (Would fail but shows intent)'
    ]
  })
}