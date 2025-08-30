# Function Call Visualization - TaskMaster Pro

This diagram shows the relationships between functions and API endpoints in the codebase.

## How to View

- Copy the Mermaid code below into any Mermaid-compatible viewer
- Use GitHub (supports Mermaid in markdown files)
- Use online tools like mermaid.live
- VS Code with Mermaid preview extensions

## Color Legend

- 🟢 **Green**: Entry points (API routes and main components)
- 🔵 **Blue**: Utility functions
- 🌸 **Pink**: React hooks and lifecycle methods

## Function Call Graph

```mermaid
graph TD
    %% Entry Points (Green)
    style Home fill:#90EE90
    style POST_login fill:#90EE90
    style GET_login fill:#90EE90
    style POST_tasks fill:#90EE90
    style GET_tasks fill:#90EE90
    style POST_execute fill:#90EE90
    style GET_execute fill:#90EE90
    style POST_upload fill:#90EE90
    style GET_upload fill:#90EE90

    %% Utilities (Blue)
    style execAsync fill:#ADD8E6
    style promisify fill:#ADD8E6
    style writeFile fill:#ADD8E6
    style mkdir fill:#ADD8E6

    %% React Components/Hooks
    style useState fill:#FFB6C1
    style useEffect fill:#FFB6C1
    style useRouter fill:#FFB6C1

    %% Main Application Flow
    subgraph Frontend["Frontend Components"]
        Home[Home Component]
        handleLogin[handleLogin]
        handleLogout[handleLogout]

        Home --> useState
        Home --> useEffect
        Home --> useRouter
        Home --> handleLogin
        Home --> handleLogout

        handleLogin --> fetch_login[fetch /api/auth/login]
        handleLogout --> localStorage_remove[localStorage.removeItem]
        useEffect --> localStorage_get[localStorage.getItem]
        handleLogin --> localStorage_set[localStorage.setItem]
    end

    %% Authentication API
    subgraph Auth["Auth API (/api/auth/login)"]
        POST_login[POST /api/auth/login]
        GET_login[GET /api/auth/login]

        POST_login --> request_json_auth[request.json]
        POST_login --> NextResponse_json_auth[NextResponse.json]
        POST_login --> cookies_set[response.cookies.set]
        POST_login --> console_log_auth[console.log]
        POST_login --> console_error_auth[console.error]

        GET_login --> POST_login
        GET_login --> NextResponse_json_auth
    end

    %% Tasks API
    subgraph Tasks["Tasks API (/api/tasks)"]
        GET_tasks[GET /api/tasks]
        POST_tasks[POST /api/tasks]
        PUT_tasks[PUT /api/tasks]

        GET_tasks --> console_log_tasks[console.log]
        GET_tasks --> NextResponse_json_tasks[NextResponse.json]

        POST_tasks --> request_json_tasks[request.json]
        POST_tasks --> NextResponse_json_tasks
        POST_tasks --> console_log_tasks

        PUT_tasks --> request_json_tasks
        PUT_tasks --> NextResponse_json_tasks
    end

    %% Admin Execute API
    subgraph Execute["Admin Execute API (/api/admin/execute)"]
        POST_execute[POST /api/admin/execute]
        GET_execute[GET /api/admin/execute]

        POST_execute --> request_json_exec[request.json]
        POST_execute --> execAsync
        POST_execute --> console_log_exec[console.log]
        POST_execute --> NextResponse_json_exec[NextResponse.json]

        execAsync --> promisify

        GET_execute --> POST_execute
        GET_execute --> NextResponse_json_exec
    end

    %% Upload API
    subgraph Upload["Upload API (/api/upload)"]
        POST_upload[POST /api/upload]
        GET_upload[GET /api/upload]

        POST_upload --> request_formData[request.formData]
        POST_upload --> path_join[path.join]
        POST_upload --> mkdir
        POST_upload --> file_arrayBuffer[file.arrayBuffer]
        POST_upload --> Buffer_from[Buffer.from]
        POST_upload --> writeFile
        POST_upload --> console_log_upload[console.log]
        POST_upload --> console_error_upload[console.error]
        POST_upload --> NextResponse_json_upload[NextResponse.json]

        GET_upload --> NextResponse_json_upload
    end

    %% Client-Server Connections
    fetch_login -->|HTTP POST| POST_login

    %% Recursive Connection
    GET_execute --> GET_execute
```

## Key Observations

### Main Execution Paths

1. **Authentication Flow**: `Home Component → handleLogin → fetch → POST /api/auth/login`
2. **Task Management**: Direct API calls to `/api/tasks` endpoints
3. **File Upload**: `POST /api/upload → formData → writeFile`
4. **Command Execution**: `POST /api/admin/execute → execAsync` (⚠️ Security Risk)

### Critical Security Concerns

- The admin execute endpoint allows arbitrary command execution
- GET endpoints that trigger POST actions (security anti-pattern)
- No authentication checks visible in the function flow
- Direct file system access without validation

### File References

- **Frontend**: `app/page.tsx:21-55` (handleLogin function)
- **Auth API**: `app/api/auth/login/route.ts:12-82` (POST handler)
- **Tasks API**: `app/api/tasks/route.ts:33-119` (GET/POST handlers)
- **Execute API**: `app/api/admin/execute/route.ts:7-126` (Command execution)
- **Upload API**: `app/api/upload/route.ts:5-94` (File upload handler)
