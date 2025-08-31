import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize any global app state here
    console.log('CleanShare Pro UI initialized');
  }, []);

  return <Component {...pageProps} />
}