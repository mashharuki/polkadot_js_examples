import type { AppProps } from 'next/app'
import '../styles/globals.css'

/**
 * MyApp component
 * @param param0 
 * @returns 
 */
function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
