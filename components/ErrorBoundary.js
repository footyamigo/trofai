import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error Details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>Please try refreshing the page or check your internet connection.</p>
            {this.state.error && this.state.error.message.includes('aws_amplify') && (
              <div>
                <p>There seems to be an issue with AWS Amplify authentication.</p>
                <p>Please ensure your Cognito configuration is correct in your environment variables.</p>
              </div>
            )}
          </details>
          <button 
            onClick={() => window.location.reload()}
            className="refresh-button"
          >
            Refresh Page
          </button>
          
          <style jsx>{`
            .error-container {
              padding: 20px;
              border: 1px solid #f5c6cb;
              border-radius: 4px;
              color: #721c24;
              background-color: #f8d7da;
              margin: 20px;
              max-width: 600px;
              margin: 40px auto;
            }
            h2 {
              color: #721c24;
              margin-top: 0;
            }
            details {
              margin: 15px 0;
            }
            summary {
              cursor: pointer;
              font-weight: bold;
            }
            .refresh-button {
              background-color: #0062cc;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            .refresh-button:hover {
              background-color: #0069d9;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 