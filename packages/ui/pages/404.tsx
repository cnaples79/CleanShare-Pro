export default function Custom404() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center' 
    }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ color: '#007bff' }}>Go back home</a>
    </div>
  )
}