import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
  hasGetInitialProps?: boolean
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center' 
    }}>
      <h1>CleanShare Pro</h1>
      <h2>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </h2>
      <p>
        {statusCode === 404 ? (
          'This page could not be found.'
        ) : (
          'Something went wrong. Please try refreshing the page.'
        )}
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Refresh Page
      </button>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error