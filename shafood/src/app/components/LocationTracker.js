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
import SearchAnimation from './SearchAnimation';
import { useRouter } from 'next/navigation';


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
  const router = useRouter();

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
      router.push(`/chat?users=${encodeURIComponent(JSON.stringify(selectedUsers))}`);
    } else {
      console.log('No users selected for chat');
    }
  }, [selectedUsers, router]);

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
    <div className="w-full max-w-4xl mx-auto">
      {loadingLocation ? (
        <div className="flex justify-center items-center h-64">
          <Loader size="h-16 w-16" />
        </div>
      ) : location ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center w-full"
        >
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-600 dark:text-orange-400 text-4xl mb-4 animate-bounce" />
          <div className="w-full max-w-lg mb-6">
            <CuteMap latitude={location.latitude} longitude={location.longitude} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <motion.button 
              onClick={() => setPreferencesModalOpen(true)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add Your Preferences
            </motion.button>
            {preferencesUpdated && (
              <motion.button 
                onClick={fetchNearbyUsers}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
                Search Nearby
              </motion.button>
            )}
          </div>
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
                className="mt-8 p-6 bg-orange-100 dark:bg-gray-700 rounded-lg shadow-md text-center w-full max-w-md"
              >
                <FontAwesomeIcon icon={faUserFriends} className="text-5xl text-orange-500 dark:text-orange-400 mb-4" />
                <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">No Nearby Users Found</h3>
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
            onOpenChat={openChat}
          />
        </motion.div>
      ) : (
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center">No location data available.</p>
      )}
    </div>
  );
};


export default LocationTracker;