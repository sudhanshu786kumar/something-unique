'use client';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useLocation from '../hooks/useGeolocation';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faUtensils, 
  faShoppingBasket, 
  faCartPlus, 
  faUserFriends, 
  faComments,
  faLocationDot,
  faMoneyBill,
  faSpinner,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import SearchAnimation from './SearchAnimation';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import PreferencesModal from './PreferencesModal';
import NearbyUsersDrawer from './NearbyUsersDrawer';
import Chat from './Chat';
import ErrorBoundary from './ErrorBoundary';

// Move getProviderIcon to the top level
const getProviderIcon = (provider) => {
  const providerIcons = {
    Zomato: <FontAwesomeIcon icon={faUtensils} />,
    Swiggy: <FontAwesomeIcon icon={faShoppingBasket} />,
    Zepto: <FontAwesomeIcon icon={faCartPlus} />,
  };
  return providerIcons[provider] || <FontAwesomeIcon icon={faUtensils} />;
};

// Lazy load the map component with no SSR
const CuteMap = dynamic(
  () => import('./CuteMap').then(mod => mod.default),
  { 
    loading: () => <MapLoadingFallback />,
    ssr: false 
  }
);

const MapLoadingFallback = () => (
  <div className="relative w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-3">
        <FontAwesomeIcon 
          icon={faLocationDot} 
          className="text-4xl text-orange-500 mb-2 animate-bounce" 
        />
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  </div>
);

const QuickLocationInfo = ({ location }) => {
  if (!location) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-4">
        <div className="p-4 bg-orange-100 dark:bg-orange-900 rounded-full">
          <FontAwesomeIcon 
            icon={faMapMarkerAlt} 
            className="text-2xl text-orange-500 dark:text-orange-400" 
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Your Current Location
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const PreferencesSummary = ({ preferences, nearbyUsers, onUpdateClick, potentialUsers }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Your Preferences
        </h2>
        <motion.button
          onClick={onUpdateClick}
          className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FontAwesomeIcon icon={faUtensils} />
          Update
        </motion.button>
      </div>

      <div className="space-y-6">
        {/* Current Settings */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {preferences.foodProviders.map(provider => (
              <span 
                key={provider}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-full text-sm flex items-center gap-2"
              >
                {getProviderIcon(provider)}
                {provider}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>Range: {preferences.locationRange || 7}km</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FontAwesomeIcon icon={faMoneyBill} />
                <span>Budget: {preferences.priceRange || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Matches */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                <FontAwesomeIcon 
                  icon={faUserFriends} 
                  className="text-green-600 dark:text-green-400" 
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {nearbyUsers.length}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Current Matches
                </p>
              </div>
            </div>
          </div>

          {/* Potential Matches */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                <FontAwesomeIcon 
                  icon={faUserFriends} 
                  className="text-blue-600 dark:text-blue-400" 
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {potentialUsers?.length || 0}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-500">
                  Potential Matches
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {nearbyUsers.length === 0 && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-100 dark:border-orange-800">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">
              Suggestions to find more matches:
            </p>
            <ul className="space-y-2 text-sm text-orange-600 dark:text-orange-300">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                Increase your location range
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUtensils} className="text-orange-500" />
                Add more food providers
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMoneyBill} className="text-orange-500" />
                Adjust your price range
              </li>
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const NoUsersFound = ({ preferences }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
  >
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full">
        <FontAwesomeIcon 
          icon={faUserFriends} 
          className="text-2xl text-orange-500 dark:text-orange-400" 
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        No Nearby Users Found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        We couldn't find any users within {preferences.locationRange}km who match your preferences.
      </p>
      <div className="pt-4 space-y-2">
        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
          Try these suggestions:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li className="flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
            Increase your location range (currently {preferences.locationRange}km)
          </li>
          <li className="flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faUtensils} className="text-orange-500" />
            Add more food providers (currently {preferences.foodProviders.length})
          </li>
          <li className="flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-orange-500" />
            Try again at a different time
          </li>
        </ul>
      </div>
    </div>
  </motion.div>
);

const LocationTracker = ({ 
  preferences, 
  onUpdate, 
  session, 
  initialNearbyUsers, 
  loadingNearbyUsers,
  setLoadingNearbyUsers,
  userLocation,
  isPreferencesSet,
  initialPreferences,
}) => {
  const [location, setLocation] = useState(userLocation);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState(initialNearbyUsers || []);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userLocations, setUserLocations] = useState({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchComplete, setSearchComplete] = useState(false);
  const [preferencesUpdated, setPreferencesUpdated] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loadingLocation, setLoadingLocation] = useState(!userLocation);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [potentialUsers, setPotentialUsers] = useState([]);
  const [searchButtonLoading, setSearchButtonLoading] = useState(false);

  // Update location when userLocation prop changes
  useEffect(() => {
    if (userLocation) {
      setLocation(userLocation);
      setLoadingLocation(false);
    }
  }, [userLocation]);

  // Initialize map with proper dimensions
  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    position: 'relative',
    borderRadius: '0.5rem',
    overflow: 'hidden'
  };

  // Add error handling for map loading
  const handleMapError = (error) => {
    console.error('Map loading error:', error);
    toast.error('Failed to load map. Please refresh the page.');
  };

  // Handle map load success
  const handleMapLoaded = () => {
    setIsMapLoaded(true);
  };

  useEffect(() => {
    if (location) {
      setLoadingLocation(false);
    }
  }, [location]);

  useEffect(() => {
    if (session?.user) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
      });

      const channel = pusher.subscribe('presence-online');
      
      channel.bind('pusher:subscription_succeeded', (members) => {
        setOnlineUsers(new Set(Object.keys(members.members)));
      });

      channel.bind('pusher:member_added', (member) => {
        setOnlineUsers(prev => new Set([...prev, member.id]));
      });

      channel.bind('pusher:member_removed', (member) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(member.id);
          return newSet;
        });
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe('presence-online');
      };
    }
  }, [session]);

  const handlePreferencesUpdate = (newPreferences) => {
    onUpdate(newPreferences);
    setPreferencesModalOpen(false);
    setPreferencesUpdated(true);
  };

  // Update the fetchNearbyUsers function to use the current location
  const fetchNearbyUsers = async () => {
    if (!location) return;
    
    setSearchButtonLoading(true);
    setSearchComplete(false);
    try {
      const foodProviders = preferences.foodProviders.join(',');
      const priceRange = preferences.priceRange;
      const url = `/api/users/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=${preferences.locationRange || 7}&foodProviders=${foodProviders}&priceRange=${priceRange}`;
      
      console.log('Fetching nearby users with URL:', url); // Debug log
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Nearby users response:', data); // Debug log
      
      if (response.ok) {
        const locationMap = {};
        data.forEach(user => {
          if (user.location) {
            locationMap[user.id] = user.location;
          }
        });
        setUserLocations(locationMap);
        setNearbyUsers(data);
        
        // Only open drawer if users were found
        if (data.length > 0) {
        setIsDrawerOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      toast.error('Failed to fetch nearby users');
    } finally {
      setSearchButtonLoading(false);
      setSearchComplete(true);
    }
  };

  const handleUserSelection = useCallback((user) => {
    setSelectedUsers((prevSelectedUsers) => {
      const isAlreadySelected = prevSelectedUsers.some(
        (selectedUser) => selectedUser.id === user.id
      );

      if (session?.user?.id === user.id) {
        return prevSelectedUsers;
      }

      if (isAlreadySelected) {
        return prevSelectedUsers.filter(
          (selectedUser) => selectedUser.id !== user.id
        );
      } else {
        return [...prevSelectedUsers, user];
      }
    });
  }, [session]);

  const openChat = useCallback(async () => {
    if (selectedUsers.length > 0) {
      const filteredUsers = selectedUsers.filter(user => user.id !== session?.user?.id);
      
      if (!filteredUsers.length) {
        toast.error('Please select users to chat with', {
          position: "top-right",
        });
        return;
      }

      const usersWithoutLocation = filteredUsers.filter(user => !userLocations[user.id]);
      if (usersWithoutLocation.length > 0) {
        toast.warning(`Some users haven't shared their location yet: ${usersWithoutLocation.map(u => u.name).join(', ')}`, {
          position: "top-right",
        });
      }

      if (!activeChatId) {
        try {
          const response = await fetch('/api/chat/find-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userIds: filteredUsers.map(u => u.id),
              userLocations: userLocations
            }),
          });

          if (response.ok) {
            const { chatId } = await response.json();
            setActiveChatId(chatId);
            setTimeout(() => {
              setShowChat(true);
            }, 50);
          } else {
            throw new Error('Failed to create chat session');
          }
        } catch (error) {
          console.error('Error opening chat:', error);
          toast.error('Failed to open chat. Please try again.', {
            position: "top-right",
          });
        }
      } else {
        setTimeout(() => {
          setShowChat(true);
        }, 50);
      }
    } else {
      toast.error('Please select users to chat with', {
        position: "top-right",
      });
    }
  }, [selectedUsers, session, activeChatId, userLocations]);

  useEffect(() => {
    return () => {
      setActiveChatId(null);
      setShowChat(false);
    };
  }, []);

  const fetchPotentialUsers = async () => {
    if (!location) return;
    
    try {
      const response = await fetch(`/api/users/potential?latitude=${location.latitude}&longitude=${location.longitude}&radius=${(preferences.locationRange || 7) + 5}`);
      if (response.ok) {
        const data = await response.json();
        setPotentialUsers(data);
        console.log(data)
      }
    } catch (error) {
      console.error('Error fetching potential users:', error);
    }
  };

  useEffect(() => {
    if (location) {
      fetchPotentialUsers();
    }
  }, [location, preferences]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {loadingLocation ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh]"
        >
          <FontAwesomeIcon 
            icon={faLocationDot} 
            className="text-6xl text-orange-500 animate-bounce mb-6" 
          />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Getting your location...
          </p>
        </motion.div>
      ) : location ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <QuickLocationInfo location={location} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Map Section - Takes up 3 columns on large screens */}
            <div className="lg:col-span-3 h-full">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Location Map
                </h2>
                <div className="relative h-[400px] rounded-lg overflow-hidden" style={mapContainerStyle}>
                  <ErrorBoundary>
                    <Suspense fallback={<MapLoadingFallback />}>
                      <CuteMap
                        center={location ? [location.latitude, location.longitude] : null}
                        nearbyUsers={nearbyUsers}
                        onLoad={handleMapLoaded}
                        onError={handleMapError}
                        style={mapContainerStyle}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </div>
            </div>

            {/* Actions Section - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-6">
              <PreferencesSummary 
                preferences={preferences}
                nearbyUsers={nearbyUsers}
                potentialUsers={potentialUsers}
                onUpdateClick={() => setPreferencesModalOpen(true)}
              />

              {preferencesUpdated && (
                <motion.button 
                  onClick={fetchNearbyUsers}
                  disabled={searchButtonLoading}
                  className={`w-full bg-gradient-to-r ${
                    searchButtonLoading 
                      ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                      : 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  } text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3`}
                  whileHover={!searchButtonLoading ? { scale: 1.02 } : {}}
                  whileTap={!searchButtonLoading ? { scale: 0.98 } : {}}
                >
                  {searchButtonLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUserFriends} />
                      Search Nearby Users
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          <PreferencesModal
            isOpen={preferencesModalOpen}
            onClose={() => setPreferencesModalOpen(false)}
            onUpdate={handlePreferencesUpdate}
            userLocation={location}
          />

          <AnimatePresence>
            {searchComplete && nearbyUsers.length === 0 && (
              <NoUsersFound preferences={preferences} />
            )}
          </AnimatePresence>

          {isDrawerOpen && (
            <NearbyUsersDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              users={nearbyUsers}
              onSelectUser={handleUserSelection}
              getProviderIcon={getProviderIcon}
              selectedUsers={selectedUsers}
            />
          )}

          {showChat && activeChatId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50"
            >
              <Chat
                selectedUsers={selectedUsers}
                onUpdateSelectedUsers={handleUserSelection}
                initialChatId={activeChatId}
                onClose={() => setShowChat(false)}
                showOrderProcess={true}
                userLocations={userLocations}
                onlineUsers={onlineUsers}
              />
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-400 py-12">
          No location data available. Please enable location services.
        </div>
      )}
    </div>
  );
};

export default LocationTracker;


