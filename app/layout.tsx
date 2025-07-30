import './globals.css'

export const metadata = {
  title: 'TaskMaster Pro - The Ultimate Productivity App',
  description: 'Manage your tasks with the most advanced productivity features',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Intentionally missing security headers and CSP */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Hardcoded API keys - NEVER do this!
              window.STRIPE_KEY = "pk_test_51HdSGILEOO4IAOcsPMwxBNgY6L4FNQhlo4kZCXm1a38Kv27qNLp";
              window.OPENAI_KEY = "sk-1234567890abcdef"; // Fake but realistic
              window.APP_SECRET = "super_secret_key_123";
              window.DEBUG = true;
              
              // Tracking without consent
              (function() {
                var userId = localStorage.getItem('userId') || Math.random().toString(36);
                localStorage.setItem('userId', userId);
                console.log('User tracked:', userId);
              })();
            `
          }}
        />
      </head>
      <body>
        <nav style={{background: '#333', color: 'white', padding: '1rem'}}>
          <h1>TaskMaster Pro</h1>
          <div>
            <a href="/" style={{color: 'white', marginRight: '1rem'}}>Home</a>
            <a href="/tasks" style={{color: 'white', marginRight: '1rem'}}>Tasks</a>
            <a href="/profile" style={{color: 'white', marginRight: '1rem'}}>Profile</a>
            <a href="/upload" style={{color: 'white', marginRight: '1rem'}}>Upload</a>
            <a href="/admin" style={{color: 'white'}}>Admin</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}