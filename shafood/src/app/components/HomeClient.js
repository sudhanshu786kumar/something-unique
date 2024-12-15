'use client'

import { useState, useEffect, lazy, Suspense, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faTimes, faSearch, faMapMarkerAlt, faUtensils } from '@fortawesome/free-solid-svg-icons'
import Loader from './Loader'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useLoadScript } from '@react-google-maps/api';
import { Combobox } from '@headlessui/react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
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

  // Add Google Maps script loader
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    // Try to get saved location from localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setSelectedLocation(JSON.parse(savedLocation));
    }
  }, []);

  // Location search component
  const LocationSearchBox = () => {
    const inputRef = useRef(null);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);
    const typingTimeoutRef = useRef(null);
    
    const {
      ready,
      suggestions: { status, data },
      setValue: setPlacesValue,
      clearSuggestions,
    } = usePlacesAutocomplete({
      requestOptions: {
        componentRestrictions: { country: 'IN' },
      },
      debounce: 300,
      cacheKey: 'location-search',
    });

    // Update suggestions when API returns data
    useEffect(() => {
      if (status === "OK" && data.length > 0) {
        setSuggestions(data.slice(0, 5));
        setIsSearching(false);
        setShouldShowSuggestions(true);
      }
    }, [status, data]);

    const handleInputChange = (e) => {
      const value = e.target.value;
      setInputValue(value);
      setShouldShowSuggestions(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (value.length > 3) {
        setIsSearching(true);
        typingTimeoutRef.current = setTimeout(() => {
          setPlacesValue(value);
        }, 1000);
      } else {
        setIsSearching(false);
        clearSuggestions();
        setSuggestions([]);
      }
    };

    const handleSelect = async (address) => {
      try {
        setInputValue(address);
        clearSuggestions();
        setSuggestions([]);
        setShouldShowSuggestions(false);

        const results = await getGeocode({ address });
        const { lat, lng } = await getLatLng(results[0]);
        const newLocation = {
          address,
          latitude: lat,
          longitude: lng
        };
        setSelectedLocation(newLocation);
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        
        toast.success("Location set successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Geocoding error:", error);
        toast.error("Error setting location");
        setShouldShowSuggestions(true);
      }
    };

    // Handle click outside to close suggestions
    const handleClickOutside = (e) => {
      if (!e.target.closest('.location-search-container')) {
        setShouldShowSuggestions(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div className="relative location-search-container">
        <FontAwesomeIcon 
          icon={faMapMarkerAlt} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 z-10"
        />
        <Combobox
          value={inputValue}
          onChange={handleSelect}
          as="div"
        >
          <div className="relative">
            <Combobox.Input
              ref={inputRef}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter your location (minimum 4 characters)"
              disabled={!ready}
              displayValue={(val) => val}
              onChange={handleInputChange}
              onFocus={() => setShouldShowSuggestions(true)}
              autoComplete="off"
            />
            <Combobox.Options 
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-lg overflow-auto"
              static
            >
              {shouldShowSuggestions && (
                <>
                  {inputValue.length <= 3 ? (
                    <div className="p-2 text-gray-500 dark:text-gray-400">
                      Please enter at least 4 characters...
                    </div>
                  ) : isSearching ? (
                    <div className="p-2 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <div className="animate-spin">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                      </div>
                      <span>Searching locations...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map(({ place_id, description }) => (
                      <Combobox.Option
                        key={place_id}
                        value={description}
                        className={({ active }) =>
                          `p-2 cursor-pointer ${
                            active
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100'
                              : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                          <span>{description}</span>
                        </div>
                      </Combobox.Option>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 dark:text-gray-400">
                      No results found
                    </div>
                  )}
                </>
              )}
            </Combobox.Options>
          </div>
        </Combobox>
      </div>
    );
  };

  const handlePreferencesUpdate = (newPreferences) => {
    setPreferences(newPreferences);
    setShowPreferencesModal(false);
    localStorage.setItem('pendingPreferences', JSON.stringify(newPreferences));
    router.push('/login?redirect=chat');
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
                  {isLoaded ? (
                    <LocationSearchBox />
                  ) : (
                    <div className="relative">
                      <FontAwesomeIcon 
                        icon={faMapMarkerAlt} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500"
                      />
                      <input
                        type="text"
                        placeholder="Loading location search..."
                        disabled
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  )}
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

            {!showPreferencesModal && (
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
