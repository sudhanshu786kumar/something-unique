import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils, faUsers, faMapMarkerAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faTwitter, faFacebook } from '@fortawesome/free-brands-svg-icons'
import dynamic from 'next/dynamic'

const HomeClient = dynamic(() => import('./HomeClient'), { ssr: false })

export default function HomeStatic() {
  const steps = [
    { title: 'Register & Login', description: 'Create an account and log in to start saving.', icon: faUsers },
    { title: 'Set Preferences', description: 'Choose your preferred providers, price range, and location.', icon: faUtensils },
    { title: 'Order Together', description: 'Find nearby users and place orders as a group.', icon: faMapMarkerAlt },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100">
      <HomeClient steps={steps} />
      <footer className="bg-orange-600 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-lg">&copy; {new Date().getFullYear()} ShaFood. All rights reserved.</p>
            </div>
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="https://instagram.com/shafood" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors duration-300">
                <FontAwesomeIcon icon={faInstagram} size="lg" />
              </a>
              <a href="https://twitter.com/shafood" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors duration-300">
                <FontAwesomeIcon icon={faTwitter} size="lg" />
              </a>
              <a href="https://facebook.com/shafood" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors duration-300">
                <FontAwesomeIcon icon={faFacebook} size="lg" />
              </a>
            </div>
            <div>
              <Link href="/contact" className="flex items-center hover:text-orange-200 transition-colors duration-300">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
