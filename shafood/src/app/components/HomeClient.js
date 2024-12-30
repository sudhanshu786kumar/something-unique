'use client'

import { useState, useEffect, lazy, Suspense, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faTimes, faSearch, faMapMarkerAlt, faUtensils, faSpinner } from '@fortawesome/free-solid-svg-icons'
import Loader from './Loader'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation';
import PreferencesModal from './PreferencesModal';

const StepCard = lazy(() => import('./StepCard'))
const FeatureCard = lazy(() => import('./FeatureCard'))

// Import animations
import savingMoneyAnimation from '../animations/saving-money.json'
import orderTogetherAnimation from '../animations/order-together.json'
import chatAnimation from '../animations/chat.json'

// Add new component for skeleton loader
const LocationSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-2 p-2">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    ))}
  </div>
);

// Add these skeleton components at the top
const LocationSearchSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full w-full mb-2"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LocationSearchResult = ({ suggestion, onSelect, handleLocationSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    onClick={() => handleLocationSelect(suggestion)}
    className="p-3 hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 border-gray-100 dark:border-gray-700 transition-all duration-200"
  >
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
          {suggestion.display_name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {suggestion.type} • {suggestion.address?.city || suggestion.address?.town}
        </p>
      </div>
    </div>
  </motion.div>
);

// Update the LocationSearchBox component to receive and update isFocused through props
const LocationSearchBox = ({ handleLocationSelect, isFocused, setIsFocused }) => {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  const searchLocations = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `limit=5&` +
        `addressdetails=1&` +
        `countrycodes=in`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      toast.error('Failed to search locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = (query) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchLocations(query);
    }, 300);
  };

  useEffect(() => {
    if (isFocused && address.length > 0) {
      setShowLocationSearch(true);
    } else {
      setShowLocationSearch(false);
    }
  }, [isFocused, address]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            debouncedSearch(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search your location..."
          className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all dark:bg-gray-800 dark:border-orange-700 dark:text-white shadow-sm hover:shadow-md"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <FontAwesomeIcon icon={faSpinner} className="text-orange-500 text-xl" />
            </motion.div>
          ) : (
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 text-xl" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {(isFocused && address.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {loading ? (
              <LocationSearchSkeleton />
            ) : suggestions.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto suggestions-container">
                {suggestions.map((suggestion) => (
                  <LocationSearchResult
                    key={suggestion.place_id}
                    suggestion={suggestion}
                    handleLocationSelect={handleLocationSelect}
                  />
                ))}
              </div>
            ) : address.length >= 3 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No locations found
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Type at least 3 characters to search
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function HomeClient({ steps }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [preferences, setPreferences] = useState({
    foodProviders: [],
    priceRange: '',
    locationRange: 7
  });

  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const searchLocations = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = async (location) => {
    try {
      const newLocation = {
        address: location.display_name,
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon)
      };
      
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      setSelectedLocation(newLocation);
      setShowPreferencesModal(true);
      toast.success('Location set! Now set your preferences.');
    } catch (error) {
      console.error('Error setting location:', error);
      toast.error('Failed to set location. Please try again.');
    }
  };

  useEffect(() => {
    // Try to get saved location from localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setSelectedLocation(JSON.parse(savedLocation));
    }
  }, []);

  const handlePreferencesUpdate = async (newPreferences) => {
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      localStorage.setItem('pendingPreferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      setShowPreferencesModal(false);
      
      // Only redirect if both location and preferences are set
      if (selectedLocation) {
        router.push('/dashboard');
        toast.success('All set! Redirecting to dashboard...');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  useEffect(() => {
    
    setIsLoading(false)

    
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
        <Loader size="h-16 w-16" />
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        <header className="py-4 px-4 md:px-12 bg-white bg-opacity-90 shadow-md sticky top-0 z-[5]">
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

        <main className="container mx-auto px-4 py-16 relative z-[1]">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-3xl mx-auto mb-10 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <LocationSearchBox 
                    handleLocationSelect={handleLocationSelect}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                  />
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => {
                      if (!selectedLocation) {
                        toast.warning("Please set your location first");
                        return;
                      }
                      setShowPreferencesModal(true);
                    }}
                    className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faUtensils} />
                    Set Order Preferences
                  </button>
                </div>
              </div>

              {/* Add PreferencesModal */}
              <PreferencesModal
                isOpen={showPreferencesModal}
                onClose={() => setShowPreferencesModal(false)}
                onUpdate={handlePreferencesUpdate}
                userLocation={selectedLocation}
                className="z-[100]"
              />
            </motion.div>

            {!showPreferencesModal && !isFocused && (
              <motion.div 
                className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6 relative z-[1]"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link 
                  href="/register" 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-full transition duration-300 transform hover:scale-105 text-center shadow-lg"
                >
                  Get Started
                </Link>
                <Link 
                  href="/login" 
                  className="bg-white hover:bg-gray-100 text-orange-500 font-bold py-4 px-10 rounded-full transition duration-300 transform hover:scale-105 text-center shadow-lg border border-orange-500"
                >
                  Login
                </Link>
              </motion.div>
            )}
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
      </div>
    </>
  )
}
