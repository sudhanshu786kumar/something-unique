import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useLocation from '../hooks/useGeolocation';
import CuteMap from './CuteMap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faUtensils, faShoppingBasket, faCartPlus, faUserFriends, faComments } from '@fortawesome/free-solid-svg-icons';
import Loader from './Loader';
import PreferencesModal from './PreferencesModal';
import NearbyUsersDrawer from './NearbyUsersDrawer';
import ChatModal from './ChatModal';
import SearchAnimation from './SearchAnimation';

const LocationTracker = ({ preferences, onUpdate }) => {
  const location = useLocation();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [preferencesUpdated, setPreferencesUpdated] = useState(false);
  const { data: session } = useSession();
  const [chatOpen, setChatOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchComplete, setSearchComplete] = useState(false);

  useEffect(() => {
    if (location) {
      setLoadingLocation(false);
    }
  }, [location]);

  const handlePreferencesUpdate = (newPreferences) => {
    onUpdate(newPreferences);
    setPreferencesModalOpen(false);
    setPreferencesUpdated(true);
  };

  const fetchNearbyUsers = async () => {
    if (location) {
      setLoadingNearbyUsers(true);
      setSearchComplete(false);
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
          setIsDrawerOpen(true);
        } else {
          console.error('Error fetching nearby users:', data.error);
        }
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      } finally {
        setLoadingNearbyUsers(false);
        setSearchComplete(true);
      }
    }
  };

  const handleUserSelection = useCallback((user) => {
    setSelectedUsers((prevSelectedUsers) => {
      const isAlreadySelected = prevSelectedUsers.some(
        (selectedUser) => selectedUser.id === user.id
      );

      let newSelectedUsers;
      if (isAlreadySelected) {
        newSelectedUsers = prevSelectedUsers.filter(
          (selectedUser) => selectedUser.id !== user.id
        );
      } else {
        newSelectedUsers = [...prevSelectedUsers, user];
      }

      console.log('Updated Selected Users:', newSelectedUsers);
      return newSelectedUsers;
    });
  }, []);

  const openChat = useCallback(() => {
    if (selectedUsers.length > 0) {
      setChatOpen(true);
    } else {
      console.log('No users selected for chat');
    }
  }, [selectedUsers]);

  const getProviderIcon = (provider) => {
    const providerIcons = {
      Zomato: <FontAwesomeIcon icon={faUtensils} />,
      Swiggy: <FontAwesomeIcon icon={faShoppingBasket} />,
      Zepto: <FontAwesomeIcon icon={faCartPlus} />,
    };
    return providerIcons[provider] || <FontAwesomeIcon icon={faUtensils} />;
  };

  useEffect(() => {
    console.log('Selected Users (from useEffect):', selectedUsers);
  }, [selectedUsers]);

  const handleUpdateSelectedUsers = (updatedUsers) => {
    setSelectedUsers(updatedUsers.filter(user => user.id !== session?.user?.id));
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
          {loadingNearbyUsers && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <SearchAnimation />
            </motion.div>
          )}
          <AnimatePresence>
            {searchComplete && nearbyUsers.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 p-4 bg-orange-100 dark:bg-gray-700 rounded-lg shadow-md text-center"
              >
                <FontAwesomeIcon icon={faUserFriends} className="text-4xl text-orange-500 mb-2" />
                <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-2">No Nearby Users Found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Don't worry! Adjust your preferences or try again later to find your perfect food buddies.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <NearbyUsersDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            users={nearbyUsers}
            onSelectUser={handleUserSelection}
            getProviderIcon={getProviderIcon}
            selectedUsers={selectedUsers}
          />

          {selectedUsers.length > 0 && (
            <button
              onClick={openChat}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 shadow-lg hover:shadow-xl"
            >
              Open Chat ({selectedUsers.length})
            </button>
          )}

          {chatOpen && (
            <ChatModal
              isOpen={chatOpen}
              onClose={() => {
                setChatOpen(false);
                setSelectedUsers([]);
              }}
              selectedUsers={selectedUsers}
              nearbyUsers={nearbyUsers}
              onUpdateNearbyUsers={fetchNearbyUsers}
              onUpdateSelectedUsers={handleUpdateSelectedUsers}
            />
          )}
        </motion.div>
      ) : (
        <p className="text-lg text-gray-600 dark:text-gray-400">No location data available.</p>
      )}
    </div>
  );
};

export default LocationTracker;