'use client'
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PreferencesModal from '../components/PreferencesModal';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Layout from '../components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faUtensils, faMoneyBill, faTimes, faSpinner, faComments } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import useGeolocation from '../hooks/useGeolocation';
import { Combobox } from '@headlessui/react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useLoadScript } from '@react-google-maps/api';
import Chat from '../components/Chat';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const location = useGeolocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userLocations, setUserLocations] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (location) {
      const updateLocationData = async () => {
        try {
          // Get address from coordinates using Google Geocoding
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results[0]) {
              const formattedLocation = {
                ...location,
                address: data.results[0].formatted_address
              };
              
              setCurrentLocation(formattedLocation);
              localStorage.setItem('userLocation', JSON.stringify(formattedLocation));
            }
          }
        } catch (error) {
          console.error('Error getting address:', error);
          // Still update coordinates even if address lookup fails
          setCurrentLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
        }
      };

      updateLocationData();
    }
  }, [location]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const savedLocation = localStorage.getItem('userLocation');
      const savedPreferences = localStorage.getItem('pendingPreferences');

      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        // Only use saved location if it has an address
        if (parsedLocation.address) {
          setCurrentLocation(parsedLocation);
        }
      }
      
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
      
      fetchInitialData();
    }
  }, [status, router]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const userData = await response.json();
        setWalletBalance(userData.walletBalance);
        setUserDetails(userData);

        // If user has preferences in DB, use those instead of localStorage
        if (userData.preferences) {
          setPreferences(userData.preferences);
          localStorage.setItem('pendingPreferences', JSON.stringify(userData.preferences));
        }

        // If user has location in DB, use that instead of localStorage
        if (userData.location) {
          setCurrentLocation(userData.location);
          localStorage.setItem('userLocation', JSON.stringify(userData.location));
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyUsers = async (userPreferences, userLocation) => {
    if (!userPreferences?.locationRange || !userLocation?.latitude) {
      toast.error('Please set your location and preferences first');
      return;
    }
    
    setIsSearching(true);
    setLoadingNearbyUsers(true);

    try {
      const response = await fetch(
        `/api/users/nearby?` + 
        `latitude=${userLocation.latitude}&` +
        `longitude=${userLocation.longitude}&` +
        `radius=${userPreferences.locationRange}&` +
        `providers=${userPreferences.foodProviders.join(',')}&` +
        `priceRange=${userPreferences.priceRange}`
      );

      if (response.ok) {
        const data = await response.json();
        setNearbyUsers(data);
        setIsDrawerOpen(true); // Open drawer after successful fetch
        
        if (data.length === 0) {
          toast.info('No nearby users found. Try adjusting your preferences or try again later.');
        } else {
          toast.success(`Found ${data.length} nearby users!`);
        }
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      toast.error('Failed to fetch nearby users');
    } finally {
      setLoadingNearbyUsers(false);
      setIsSearching(false);
    }
  };

  const handlePreferencesUpdate = async (newPreferences) => {
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, ...newPreferences }),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      setPreferences(newPreferences);
      localStorage.setItem('pendingPreferences', JSON.stringify(newPreferences));
      setPreferencesModalOpen(false);

      // Fetch nearby users with new preferences using current location
      if (currentLocation) {
        await fetchNearbyUsers(newPreferences, currentLocation);
      }
      toast.success('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences.');
    }
  };

  const LocationSearchBox = () => {
    const {
      ready,
      value,
      suggestions: { status, data },
      setValue,
      clearSuggestions,
    } = usePlacesAutocomplete();

    const handleSelect = async (address) => {
      try {
        const results = await getGeocode({ address });
        const { lat, lng } = await getLatLng(results[0]);
        const newLocation = {
          address,
          latitude: lat,
          longitude: lng
        };
        setCurrentLocation(newLocation);
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        setShowLocationSearch(false);
        toast.success('Location updated successfully!');
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error updating location');
      }
    };

    return (
      <Combobox value={value} onChange={handleSelect}>
        <div className="relative mt-2">
          <Combobox.Input
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Search for a location..."
            onChange={(e) => setValue(e.target.value)}
          />
          <Combobox.Options className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-lg overflow-auto">
            {status === "OK" &&
              data.map(({ place_id, description }) => (
                <Combobox.Option key={place_id} value={description}>
                  {({ active }) => (
                    <div className={`p-2 cursor-pointer ${
                      active ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                        <span>{description}</span>
                      </div>
                    </div>
                  )}
                </Combobox.Option>
              ))}
          </Combobox.Options>
        </div>
      </Combobox>
    );
  };

  const handleStartChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to chat with');
      return;
    }

    try {
      setIsSearching(true);
      // Create or find existing chat
      const response = await fetch('/api/chat/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers.map(user => user.id),
          userLocations: userLocations
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }

      const { chatId } = await response.json();
      
      // Store selected users and their preferences in localStorage for the chat page
      localStorage.setItem('chatUsers', JSON.stringify(selectedUsers));
      
      // Navigate to chat page with necessary params
      router.push(`/chat/${chatId}?users=${selectedUsers.map(u => u.id).join(',')}`);
      
      setIsDrawerOpen(false);
      toast.success('Opening chat room...', {
        position: "top-right",
        autoClose: 2000
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Layout walletBalance={walletBalance}>
      <div className="w-full h-full">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader size="h-16 w-16" />
          </div>
        ) : (
          <div className="p-6 max-w-4xl mx-auto">
            {/* Location Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 text-xl" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Current Location</h2>
                </div>
                <button
                  onClick={() => setShowLocationSearch(!showLocationSearch)}
                  className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  Update Location
                </button>
              </div>
              
              {showLocationSearch && isLoaded ? (
                <LocationSearchBox />
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300">
                    {currentLocation?.address || 'Getting address...'}
                  </p>
                  {!currentLocation?.address && currentLocation && (
                    <p className="text-sm text-gray-500 mt-1">
                      Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </p>
                  )}
                </>
              )}
            </motion.div>

            {/* Enhanced Preferences Display */}
            {preferences && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Your Order Preferences</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      These preferences help us find the perfect ordering partners for you
                    </p>
                  </div>
                  <button
                    onClick={() => setPreferencesModalOpen(true)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faUtensils} />
                    Update
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Food Providers Section */}
                  <div className="bg-orange-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faUtensils} className="text-orange-500" />
                      Delivery Partners
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {preferences.foodProviders.map(provider => (
                        <span key={provider} className="px-3 py-1 bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-300 rounded-full text-sm shadow-sm">
                          {provider}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Orders will be matched with users using these delivery services
                    </p>
                  </div>

                  {/* Location Range Section */}
                  <div className="bg-orange-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                      Search Range
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {preferences.locationRange}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">kilometers</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We'll find ordering partners within this distance from your location
                    </p>
                  </div>

                  {/* Price Range Section */}
                  <div className="bg-orange-50 dark:bg-gray-700/50 p-4 rounded-lg md:col-span-2">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMoneyBill} className="text-orange-500" />
                      Preferred Price Range
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {preferences.priceRange}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You'll be matched with users planning to order within this price range
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Nearby Users Section */}
            {preferences && currentLocation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <button
                  onClick={() => fetchNearbyUsers(preferences, currentLocation)}
                  className={`w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                    isSearching ? 'opacity-75 cursor-wait' : ''
                  }`}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <FontAwesomeIcon 
                        icon={faSpinner} 
                        className="animate-spin" 
                      />
                      <span>Searching Nearby Users...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUtensils} />
                      <span>Find Nearby Users</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
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
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Nearby Users</h3>
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
              <p className="text-gray-600 dark:text-gray-400">Loading nearby users...</p>
            </div>
          ) : nearbyUsers.length > 0 ? (
            <>
              <div className="space-y-4">
                {nearbyUsers.map(user => (
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
                      setSelectedUsers(prev =>
                        prev.includes(user)
                          ? prev.filter(u => u.id !== user.id)
                          : [...prev, user]
                      );
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
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl mb-1" />
                      ) : (
                        <FontAwesomeIcon icon={faComments} className="text-xl mb-1" />
                      )}
                      <span className="text-sm">Start Chat</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (selectedUsers.length === 0) {
                          toast.error('Please select users to start an order');
                          return;
                        }
                        
                        try {
                          setIsSearching(true);
                          // Create or find existing chat
                          const response = await fetch('/api/chat/find-or-create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userIds: selectedUsers.map(user => user.id),
                              userLocations: userLocations
                            }),
                          });

                          if (!response.ok) {
                            throw new Error('Failed to create chat session');
                          }

                          const { chatId } = await response.json();
                          
                          // Store selected users in localStorage
                          localStorage.setItem('chatUsers', JSON.stringify(selectedUsers));
                          
                          // Navigate to chat page with order tab active
                          router.push(`/chat/${chatId}?tab=order`);
                          
                        } catch (error) {
                          console.error('Error starting order:', error);
                          toast.error('Failed to start order. Please try again.');
                        } finally {
                          setIsSearching(false);
                        }
                      }}
                      className="p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white flex flex-col items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faUtensils} className="text-xl mb-1" />
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
                Try adjusting your preferences or search radius
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
            setShowChat(false);
            setSelectedUsers([]);
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
  );
};

export default Dashboard;
