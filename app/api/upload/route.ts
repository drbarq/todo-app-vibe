import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadPath = formData.get('uploadPath') as string || 'uploads'
    const fileName = formData.get('fileName') as string || file.name
    const userId = formData.get('userId') as string

    // Vulnerable: No authentication check
    // Vulnerable: No file type validation
    // Vulnerable: No file size limits

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Vulnerable: Using user-provided path directly without sanitization
    // This allows path traversal attacks
    const fullPath = path.join(process.cwd(), uploadPath, fileName)
    
    // Vulnerable: Logging sensitive information
    console.log(`File upload attempt:`)
    console.log(`- Original name: ${file.name}`)
    console.log(`- Upload path: ${uploadPath}`)
    console.log(`- Final name: ${fileName}`)
    console.log(`- Full path: ${fullPath}`)
    console.log(`- User ID: ${userId}`)
    console.log(`- File size: ${file.size} bytes`)
    console.log(`- File type: ${file.type}`)

    // Vulnerable: No path traversal protection
    // Create directory if it doesn't exist (dangerous with user input)
    try {
      await mkdir(path.dirname(fullPath), { recursive: true })
    } catch (error) {
      console.log('Directory creation error (might be normal):', error)
    }

    // Vulnerable: Executing user-provided filenames
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Vulnerable: Writing file to user-specified location
    await writeFile(fullPath, buffer)

    // Vulnerable: Exposing full system paths
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: fullPath,
      fileName: fileName,
      uploadPath: uploadPath,
      fileSize: file.size,
      fileType: file.type,
      // Vulnerable: Exposing system information
      serverPath: process.cwd(),
      uploadedBy: userId,
      timestamp: new Date().toISOString(),
      // Vulnerable: Suggesting dangerous file operations
      suggestions: [
        'Try uploading a .php file and visiting it directly',
        'Upload to ../../../etc/ to overwrite system files',
        'Use ../ in filename to escape upload directory'
      ]
    })

  } catch (error) {
    // Vulnerable: Exposing detailed error information including file system details
    console.error('Upload error:', error)
    
    return NextResponse.json(
      { 
        error: 'File upload failed',
        details: error.toString(),
        stack: error.stack,
        // Vulnerable: Exposing system information in errors
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

// Vulnerable: Allowing GET requests to upload endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'File upload endpoint',
    // Vulnerable: Exposing API documentation that helps attackers
    usage: {
      method: 'POST',
      contentType: 'multipart/form-data',
      fields: {
        file: 'The file to upload (any type allowed)',
        uploadPath: 'Where to store the file (supports ../ traversal)',
        fileName: 'Custom filename (can overwrite existing files)',
        userId: 'User ID (not validated)'
      }
    },
    // Vulnerable: Providing attack examples
    examples: {
      pathTraversal: 'uploadPath: "../../../etc"',
      fileOverwrite: 'fileName: "../../../app/layout.tsx"',
      maliciousFile: 'Upload .php files for code execution'
    },
    serverInfo: {
      workingDirectory: process.cwd(),
      platform: process.platform
    }
  })
}