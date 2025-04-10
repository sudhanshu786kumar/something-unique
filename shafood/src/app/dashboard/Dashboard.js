'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PreferencesModal from '../components/PreferencesModal'
import { toast } from 'react-toastify'
import Loader from '../components/Loader'
import Layout from '../components/Layout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMapMarkerAlt,
  faUtensils,
  faMoneyBill,
  faTimes,
  faSpinner,
  faComments,
  faUserFriends,
  faArrowRight,
  faHeart,
} from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'
import useGeolocation from '../hooks/useGeolocation'
import { Combobox } from '@headlessui/react'
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete'
import { useLoadScript } from '@react-google-maps/api'
import Chat from '../components/Chat'
import PreferencesSummaryCard from '../components/PreferencesSummaryCard'
import LocationTracker from '../components/LocationTracker'
import WelcomeHeader from '../components/WelcomeHeader'

const Dashboard = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false)
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState(0)
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(false)
  const [userDetails, setUserDetails] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const location = useGeolocation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [activeChatId, setActiveChatId] = useState(null)
  const [userLocations, setUserLocations] = useState({})
  const [isSearching, setIsSearching] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [locationError, setLocationError] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const isGuest = !session

  const handleAuthRequired = (action) => {
    let message
    switch (action) {
      case 'start chat':
        message = 'Please login to start chatting with nearby users'
        break
      case 'start order':
        message = 'Please login to create a group order'
        break
      default:
        message = 'Please login to access this feature'
    }

    toast.info(message, {
      position: 'top-right',
      icon: '🔒',
      duration: 4000,
    })
    localStorage.setItem('postLoginAction', action)
    router.push('/login')
  }

  useEffect(() => {
    if (location) {
      const updateLocationData = async () => {
        try {
          // Use OpenStreetMap's Nominatim API instead of Google Geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
          )

          if (response.ok) {
            const data = await response.json()
            const formattedLocation = {
              ...location,
              address: data.display_name,
            }

            setCurrentLocation(formattedLocation)
            localStorage.setItem(
              'userLocation',
              JSON.stringify(formattedLocation)
            )
          }
        } catch (error) {
          console.error('Error getting address:', error)
          // Still update coordinates even if address lookup fails
          setCurrentLocation(location)
          localStorage.setItem('userLocation', JSON.stringify(location))
        }
      }

      updateLocationData()
    }
  }, [location])

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation')
    const savedPreferences = localStorage.getItem('pendingPreferences')

    if (savedLocation) {
      const parsedLocation = JSON.parse(savedLocation)
      if (parsedLocation.address) {
        setCurrentLocation(parsedLocation)
      }
    }

    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }

    if (session) {
      fetchInitialData()
    }
  }, [session])

  const fetchInitialData = async () => {
    if (!session) return

    setLoading(true)
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const userData = await response.json()
        setWalletBalance(userData.walletBalance)
        setUserDetails(userData)

        if (userData.preferences) {
          setPreferences(userData.preferences)
          localStorage.setItem(
            'pendingPreferences',
            JSON.stringify(userData.preferences)
          )
        }

        if (userData.location) {
          setCurrentLocation(userData.location)
          localStorage.setItem(
            'userLocation',
            JSON.stringify(userData.location)
          )
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      if (session) {
        toast.error('Failed to load user data')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchNearbyUsers = async (userPreferences, userLocation) => {
    if (!userPreferences?.locationRange || !userLocation?.latitude) {
      toast.error('Please set your location and preferences first')
      return
    }

    setIsSearching(true)
    setLoadingNearbyUsers(true)

    try {
      const response = await fetch(
        `/api/users/nearby?` +
          `latitude=${userLocation.latitude}&` +
          `longitude=${userLocation.longitude}&` +
          `radius=${userPreferences.locationRange}&` +
          `providers=${userPreferences.foodProviders.join(',')}&` +
          `priceRange=${userPreferences.priceRange}`
      )

      if (response.ok) {
        const data = await response.json()
        setNearbyUsers(data)
        setIsDrawerOpen(true) // Open drawer after successful fetch

        if (data.length === 0) {
          toast.info(
            'No nearby users found. Try adjusting your preferences or try again later.'
          )
        } else {
          toast.success(`Found ${data.length} nearby users!`)
        }
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error)
      toast.error('Failed to fetch nearby users')
    } finally {
      setLoadingNearbyUsers(false)
      setIsSearching(false)
    }
  }

  const handlePreferencesUpdate = async (newPreferences) => {
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, ...newPreferences }),
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      setPreferences(newPreferences)
      localStorage.setItem('pendingPreferences', JSON.stringify(newPreferences))
      setPreferencesModalOpen(false)

      // Fetch nearby users with new preferences using current location
      if (currentLocation) {
        await fetchNearbyUsers(newPreferences, currentLocation)
      }
      toast.success('Preferences updated successfully!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences.')
    }
  }

  const LocationSearchBox = () => {
    const [address, setAddress] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)

    const searchLocations = async (query) => {
      if (!query.trim() || query.length < 3) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5`
        )

        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
        }
      } catch (error) {
        console.error('Error searching locations:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleSelect = async (location) => {
      const newLocation = {
        address: location.display_name,
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
      }

      setCurrentLocation(newLocation)
      localStorage.setItem('userLocation', JSON.stringify(newLocation))
      setShowLocationSearch(false)
      setSuggestions([])
      toast.success('Location updated successfully!')
    }

    return (
      <div className="mt-2">
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              searchLocations(e.target.value)
            }}
            placeholder="Search for a location..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <FontAwesomeIcon
            icon={loading ? faSpinner : faMapMarkerAlt}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 ${
              loading ? 'animate-spin' : ''
            }`}
          />
        </div>

        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-lg overflow-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion)}
                className="p-2 hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-orange-500"
                  />
                  <span className="text-sm">{suggestion.display_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleStartChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to chat with')
      return
    }

    try {
      setIsSearching(true)
      // Create or find existing chat
      const response = await fetch('/api/chat/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers.map((user) => user.id),
          userLocations: userLocations,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat session')
      }

      const { chatId } = await response.json()

      // Store selected users and their preferences in localStorage for the chat page
      localStorage.setItem('chatUsers', JSON.stringify(selectedUsers))

      // Navigate to chat page with necessary params
      router.push(
        `/chat/${chatId}?users=${selectedUsers.map((u) => u.id).join(',')}`
      )

      setIsDrawerOpen(false)
      toast.success('Opening chat room...', {
        position: 'top-right',
        autoClose: 2000,
      })
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start chat. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const openChat = useCallback(async () => {
    if (!session) {
      handleAuthRequired('start chat')
      return
    }
    // ... rest of the existing openChat logic ...
  }, [session, selectedUsers, activeChatId, userLocations])

  const handleOrderClick = () => {
    if (!session) {
      handleAuthRequired('start order')
      return
    }
    // ... existing order logic ...
  }

  return (
    <Layout walletBalance={walletBalance}>
      <div className="w-full max-w-6xl mx-auto p-6">
        <WelcomeHeader
          session={session}
          location={currentLocation}
          router={router}
        />

        {preferences && (
          <PreferencesSummaryCard
            preferences={preferences}
            onUpdateClick={() => setPreferencesModalOpen(true)}
          />
        )}

        <LocationTracker
          preferences={preferences}
          onUpdate={setPreferences}
          session={session}
          userLocation={currentLocation}
          isPreferencesSet={!!preferences}
          initialPreferences={preferences}
          hideLocation={true}
        />

        {/* Search Section - Available for all users */}
        {preferences && currentLocation && (
          <div className="mt-6">
            <button
              onClick={() => fetchNearbyUsers(preferences, currentLocation)}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Find Nearby Users'}
            </button>
          </div>
        )}

        {/* Chat and Order buttons - Only show when users are selected */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button
              onClick={() =>
                !session ? handleAuthRequired('start chat') : handleStartChat()
              }
              className="py-3 px-4 bg-orange-500 text-white rounded-lg"
            >
              Start Chat ({selectedUsers.length})
            </button>
            <button
              onClick={() =>
                !session
                  ? handleAuthRequired('start order')
                  : handleOrderClick()
              }
              className="py-3 px-4 bg-green-500 text-white rounded-lg"
            >
              Start Order
            </button>
          </div>
        )}
      </div>

      {/* Nearby Users Drawer - Updated version */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isDrawerOpen ? '0%' : '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed right-0 top-0 h-full w-full md:w-96 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Nearby Users
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select users to start a group order
              </p>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {loadingNearbyUsers ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FontAwesomeIcon
                icon={faSpinner}
                className="animate-spin text-3xl text-orange-500 mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400">
                Loading nearby users...
              </p>
            </div>
          ) : nearbyUsers.length > 0 ? (
            <>
              <div className="space-y-4">
                {nearbyUsers.map((user) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={user.id}
                    className={`p-4 rounded-lg border ${
                      selectedUsers.includes(user)
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    } cursor-pointer transition-all hover:shadow-md`}
                    onClick={() => {
                      setSelectedUsers((prev) =>
                        prev.includes(user)
                          ? prev.filter((u) => u.id !== user.id)
                          : [...prev, user]
                      )
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {user.name}
                        </span>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {user.preferences?.foodProviders?.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-orange-500">
                          {user.distance?.toFixed(1)}km away
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mb-6 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg"
                >
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleStartChat}
                      disabled={selectedUsers.length === 0 || isSearching}
                      className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                        selectedUsers.length > 0
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSearching ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin text-xl mb-1"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faComments}
                          className="text-xl mb-1"
                        />
                      )}
                      <span className="text-sm">Start Chat</span>
                    </button>
                    <button
                      onClick={handleOrderClick}
                      className="p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white flex flex-col items-center justify-center"
                    >
                      <FontAwesomeIcon
                        icon={faUtensils}
                        className="text-xl mb-1"
                      />
                      <span className="text-sm">New Order</span>
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleStartChat}
                disabled={selectedUsers.length === 0}
                className={`mt-6 w-full py-3 rounded-lg transition-all ${
                  selectedUsers.length > 0
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Start Chat ({selectedUsers.length} selected)
              </motion.button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <FontAwesomeIcon icon={faUtensils} size="3x" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No nearby users found matching your preferences
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {!selectedUsers.length
                  ? 'Try adjusting your preferences'
                  : selectedUsers.length === 1
                  ? 'Ready to start chat'
                  : `Ready to start group chat`}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Component */}
      {showChat && (
        <Chat
          selectedUsers={selectedUsers}
          onUpdateSelectedUsers={setSelectedUsers}
          initialChatId={activeChatId}
          onChatIdChange={setActiveChatId}
          onClose={() => {
            setShowChat(false)
            setSelectedUsers([])
          }}
          onlineUsers={onlineUsers}
          onUnreadMessagesChange={() => {}}
          hasMore={false}
          initialMessages={[]}
        />
      )}

      <PreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        onUpdate={handlePreferencesUpdate}
        initialPreferences={preferences}
        userLocation={currentLocation}
      />
    </Layout>
  )
}

export default Dashboard
