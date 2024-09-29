import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import PageLoader from './components/PageLoader'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ShaFood - Group Food Ordering',
  description: 'Order food together with nearby users',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <PageLoader>
            {children}
          </PageLoader>
        </Providers>
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </body>
    </html>
  )
}
