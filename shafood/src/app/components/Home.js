'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils, faUsers, faMapMarkerAlt, faEnvelope, faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faTwitter, faFacebook } from '@fortawesome/free-brands-svg-icons'
import dynamic from 'next/dynamic'
import Loader from './Loader'
import SEO from './SEO'

const Lottie = dynamic(() => import('react-lottie-player'), { ssr: false })

const StepCard = lazy(() => import('./StepCard'))
const FeatureCard = lazy(() => import('./FeatureCard'))

// Import animations
import savingMoneyAnimation from '../animations/saving-money.json'
import orderTogetherAnimation from '../animations/order-together.json'
import chatAnimation from '../animations/chat.json'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const steps = [
    { title: 'Register & Login', description: 'Create an account and log in to start saving.', icon: faUsers },
    { title: 'Set Preferences', description: 'Choose your preferred providers, price range, and location.', icon: faUtensils },
    { title: 'Order Together', description: 'Find nearby users and place orders as a group.', icon: faMapMarkerAlt },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prevStep) => (prevStep + 1) % steps.length)
    }, 5000)

    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => {
      clearInterval(timer)
      clearTimeout(loadingTimer)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
        <Loader size="h-16 w-16" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100">
      <SEO 
        title="ShaFood - Save Money, Eat Together!" 
        description="ShaFood helps you save on delivery charges by ordering together with nearby users."
      />
      <header className="py-4 px-4 md:px-12 bg-white bg-opacity-90 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-orange-600"
          >
            ShaFood
          </motion.h1>
          <nav className="hidden md:block">
            <motion.ul 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex space-x-6"
            >
              <li><Link href="#how-it-works" className="text-orange-600 hover:text-orange-700 font-semibold">How It Works</Link></li>
              <li><Link href="#features" className="text-orange-600 hover:text-orange-700 font-semibold">Features</Link></li>
              <li><Link href="/contact" className="text-orange-600 hover:text-orange-700 font-semibold">Contact</Link></li>
            </motion.ul>
          </nav>
          <button 
            className="md:hidden text-orange-600 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>
        {isMenuOpen && (
          <motion.nav 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-4"
          >
            <ul className="flex flex-col space-y-2">
              <li><Link href="#how-it-works" className="block py-2 px-4 text-orange-600 hover:bg-orange-100 rounded" onClick={() => setIsMenuOpen(false)}>How It Works</Link></li>
              <li><Link href="#features" className="block py-2 px-4 text-orange-600 hover:bg-orange-100 rounded" onClick={() => setIsMenuOpen(false)}>Features</Link></li>
              <li><Link href="/contact" className="block py-2 px-4 text-orange-600 hover:bg-orange-100 rounded" onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
            </ul>
          </motion.nav>
        )}
      </header>

      <main className="container mx-auto px-4 py-16">
        <motion.section
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-orange-600 leading-tight">
            Save Money, Eat Together!
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-700">
            ShaFood helps you save on delivery charges by ordering together with nearby users. Join our community and start saving today!
          </p>
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6"
          >
            <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-full transition duration-300 transform hover:scale-105 text-center shadow-lg">
              Get Started
            </Link>
            <Link href="/login" className="bg-white hover:bg-gray-100 text-orange-500 font-bold py-4 px-10 rounded-full transition duration-300 transform hover:scale-105 text-center shadow-lg border border-orange-500">
              Login
            </Link>
          </motion.div>
        </motion.section>
        
        <section id="how-it-works" className="mb-24">
          <h2 className="text-4xl font-bold mb-12 text-orange-600 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
              {steps.map((step, index) => (
                <Suspense key={index} fallback={<Loader size="h-32 w-32" />}>
                  <StepCard
                    step={index + 1}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    delay={index * 0.1}
                  />
                </Suspense>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section id="features" className="mb-24">
          <h2 className="text-4xl font-bold mb-12 text-orange-600 text-center">App Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Suspense fallback={<Loader size="h-32 w-32" />}>
              <FeatureCard
                title="Save Money"
                description="Reduce delivery charges by ordering together with nearby users."
                animation={savingMoneyAnimation}
                delay={0.1}
              />
            </Suspense>
            <Suspense fallback={<Loader size="h-32 w-32" />}>
              <FeatureCard
                title="Order Together"
                description="Find nearby users and place orders as a group."
                animation={orderTogetherAnimation}
                delay={0.2}
              />
            </Suspense>
            <Suspense fallback={<Loader size="h-32 w-32" />}>
              <FeatureCard
                title="Chat & Share Location"
                description="Easily communicate and share your location with group members."
                animation={chatAnimation}
                delay={0.3}
              />
            </Suspense>
          </div>
        </section>
      </main>

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
