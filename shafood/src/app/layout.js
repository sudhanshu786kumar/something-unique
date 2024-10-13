import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import PageLoader from './components/PageLoader'
import { ThemeProvider } from 'next-themes'
import DarkModeToggle from './components/DarkModeToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ShaFood - Group Food Ordering',
  description: 'Order food together with nearby users',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PageLoader>
            <Providers>
              <div className="min-h-screen">
                {children}
              </div>
            </Providers>
          </PageLoader>
          <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </ThemeProvider>
      </body>
    </html>
  )
}
