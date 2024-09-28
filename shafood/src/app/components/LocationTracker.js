import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useLocation from '../hooks/useGeolocation';
import CuteMap from './CuteMap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faUtensils, faShoppingBasket, faCartPlus } from '@fortawesome/free-solid-svg-icons';
import Loader from './Loader';
import PreferencesModal from './PreferencesModal';
import Chat from './Chat'; // Import the Chat component

const LocationTracker = ({ preferences, onUpdate }) => {
  const location = useLocation();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [preferencesUpdated, setPreferencesUpdated] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (location) {
      setLoadingLocation(false);
    }
  }, [location]);

  useEffect(() => {
    // Always include the logged-in user in selectedUsers
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
      const foodProviders = preferences.foodProviders.join(',');
      const priceRange = preferences.priceRange;
      const url = `/api/users/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=${preferences.locationRange || 7}&foodProviders=${foodProviders}&priceRange=${priceRange}`;
      console.log('Fetching nearby users with URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        console.log('Nearby users:', data);
        setNearbyUsers(data);
      } else {
        console.error('Error fetching nearby users:', data.error);
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
    <div className="flex flex-col items-center">
      {loadingLocation ? (
        <Loader size="h-16 w-16" />
      ) : location ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-600 text-4xl mb-4 animate-bounce" />
          <CuteMap latitude={location.latitude} longitude={location.longitude} />
          <motion.button 
            onClick={() => setPreferencesModalOpen(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300"
          >
            Add Your Preferences
          </motion.button>
          {preferencesUpdated && (
            <button 
              onClick={fetchNearbyUsers}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300"
            >
              Search Nearby
            </button>
          )}
          <PreferencesModal
            isOpen={preferencesModalOpen}
            onClose={() => setPreferencesModalOpen(false)}
            onUpdate={handlePreferencesUpdate}
            userLocation={location}
          />
          {nearbyUsers.length > 0 && (
            <>
              <h3 className="mt-4 text-lg font-bold">Nearby Users:</h3>
              <ul className="mt-2">
                {nearbyUsers
                  .filter(user => user.id !== session.user.id)
                  .map(user => (
                    <li key={user.id} className="border-b py-2 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.some((u) => u.id === user.id)}
                        onChange={() => toggleUserSelection(user)}
                        className="mr-2"
                      />
                      {user.name} - {user.distance.toFixed(2)} km away
                      {user.preferredProviders.length > 0 && (
                        <span className="ml-2 flex items-center">
                          {user.preferredProviders.map(provider => (
                            <span key={provider} className="h-4 w-4 mr-1">
                              {getProviderIcon(provider)}
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </>
          )}
          {selectedUsers.length >= 2 && <Chat selectedUsers={selectedUsers} />}
        </motion.div>
      ) : (
        <p className="text-lg text-gray-600">No location data available.</p>
      )}
    </div>
  );
};

export default LocationTracker;