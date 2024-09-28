import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useLocation from '../hooks/useGeolocation';
import CuteMap from './CuteMap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faUtensils, faShoppingBasket, faCartPlus, faUserFriends, faComments } from '@fortawesome/free-solid-svg-icons';
import Loader from './Loader';
import PreferencesModal from './PreferencesModal';
import Chat from './Chat';

const LocationTracker = ({ preferences, onUpdate }) => {
  const location = useLocation();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [preferencesUpdated, setPreferencesUpdated] = useState(false);
  const { data: session } = useSession();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (location) {
      setLoadingLocation(false);
    }
  }, [location]);

  useEffect(() => {
    if (session?.user) {
      setSelectedUsers((prev) => {
        if (!prev.some((user) => user.id === session.user.id)) {
          return [...prev, { id: session.user.id, name: session.user.name }];
        }
        return prev;
      });
    }
  }, [session]);

  const handlePreferencesUpdate = (newPreferences) => {
    onUpdate(newPreferences);
    setPreferencesModalOpen(false);
    setPreferencesUpdated(true);
  };

  const fetchNearbyUsers = async () => {
    if (location) {
      setLoadingNearbyUsers(true);
      const foodProviders = preferences.foodProviders.join(',');
      const priceRange = preferences.priceRange;
      const url = `/api/users/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=${preferences.locationRange || 7}&foodProviders=${foodProviders}&priceRange=${priceRange}`;
      console.log('Fetching nearby users with URL:', url);
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok) {
          console.log('Nearby users:', data);
          setNearbyUsers(data);
        } else {
          console.error('Error fetching nearby users:', data.error);
        }
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      } finally {
        setLoadingNearbyUsers(false);
      }
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prevSelected) => {
      const isSelected = prevSelected.some((u) => u.id === user.id);
      if (isSelected) {
        if (user.id === session.user.id) {
          return prevSelected; // Do not remove the logged-in user
        }
        return prevSelected.filter((u) => u.id !== user.id);
      } else {
        return [...prevSelected, { id: user.id, name: user.name }];
      }
    });
  };

  const getProviderIcon = (provider) => {
    const providerIcons = {
      Zomato: <FontAwesomeIcon icon={faUtensils} />,
      Swiggy: <FontAwesomeIcon icon={faShoppingBasket} />,
      Zepto: <FontAwesomeIcon icon={faCartPlus} />,
    };
    return providerIcons[provider] || <FontAwesomeIcon icon={faUtensils} />;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto relative">
      {loadingLocation ? (
        <Loader size="h-16 w-16" />
      ) : location ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center w-full"
        >
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-600 text-4xl mb-4 animate-bounce" />
          <CuteMap latitude={location.latitude} longitude={location.longitude} />
          <motion.button 
            onClick={() => setPreferencesModalOpen(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add Your Preferences
          </motion.button>
          {preferencesUpdated && (
            <motion.button 
              onClick={fetchNearbyUsers}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 shadow-lg hover:shadow-xl flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
              Search Nearby
            </motion.button>
          )}
          <PreferencesModal
            isOpen={preferencesModalOpen}
            onClose={() => setPreferencesModalOpen(false)}
            onUpdate={handlePreferencesUpdate}
            userLocation={location}
          />
          <div className="mt-6 w-full">
            {loadingNearbyUsers ? (
              <div className="flex flex-col items-center justify-center h-40">
                <Loader size="h-10 w-10" />
                <p className="text-center mt-4 text-gray-600 dark:text-gray-400">Finding nearby users...</p>
              </div>
            ) : nearbyUsers.length > 0 ? (
              <>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Nearby Users:</h3>
                <ul className="space-y-3">
                  {nearbyUsers
                    .filter(user => user.id !== session.user.id)
                    .map(user => (
                      <motion.li 
                        key={user.id} 
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.some((u) => u.id === user.id)}
                            onChange={() => toggleUserSelection(user)}
                            className="form-checkbox h-5 w-5 text-blue-600 rounded-full transition duration-150 ease-in-out"
                          />
                          <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">{user.name}</span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({user.distance.toFixed(2)} km)</span>
                        </div>
                        {user.preferredProviders.length > 0 && (
                          <div className="flex items-center space-x-2">
                            {user.preferredProviders.map(provider => (
                              <span key={provider} className="text-gray-600 dark:text-gray-400">
                                {getProviderIcon(provider)}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.li>
                    ))}
                </ul>
              </>
            ) : nearbyUsers.length === 0 && !loadingNearbyUsers ? (
              <p className="text-center text-gray-600 dark:text-gray-400">No nearby users found.</p>
            ) : null}
          </div>
          {selectedUsers.length >= 2 && (
            <motion.button
              onClick={() => setChatOpen(true)}
              className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faComments} className="mr-2" />
              Open Chat
            </motion.button>
          )}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4">
                  <Chat selectedUsers={selectedUsers} onClose={() => setChatOpen(false)} nearbyUsers={nearbyUsers} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <p className="text-lg text-gray-600 dark:text-gray-400">No location data available.</p>
      )}
    </div>
  );
};

export default LocationTracker;