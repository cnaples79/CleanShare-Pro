import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { setupIonicReact } from '@ionic/react'
import '../styles/globals.css'

// Initialize Ionic React
setupIonicReact({
  mode: 'ios', // Use iOS design patterns for consistent mobile experience
  rippleEffect: true, // Enable touch ripple effects
  animated: true // Enable page transitions
});

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize any global app state here
    console.log('CleanShare Pro UI initialized with Ionic React');
  }, []);

  return <Component {...pageProps} />
}