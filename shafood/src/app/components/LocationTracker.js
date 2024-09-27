import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useLocation from '../hooks/useGeolocation';
import CuteMap from './CuteMap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Loader from './Loader';
import PreferencesModal from './PreferencesModal';
import Chat from './Chat'; // Import the Chat component
import { toast } from 'react-toastify';

const LocationTracker = ({ preferences, onUpdate }) => {
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [preferencesUpdated, setPreferencesUpdated] = useState(false);
  const [showNearbyUsers, setShowNearbyUsers] = useState(false);
  const { data: session } = useSession();
  useLocation();

  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.userId === session?.user?.id) {
        setLocation(data);
        setLoadingLocation(false);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [session]);

  const handlePreferencesUpdate = (newPreferences) => {
    onUpdate(newPreferences);
    setPreferencesModalOpen(false);
    setPreferencesUpdated(true);
  };

  const fetchNearbyUsers = async () => {
    if (location) {
      const response = await fetch(`/api/users/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=${preferences.locationRange || 7}`);
      const data = await response.json();
      if (response.ok) {
        setNearbyUsers(data);
        setShowNearbyUsers(true);
      } else {
        console.error(data.error);
      }
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prevSelected) => {
      const isSelected = prevSelected.some((u) => u.id === user.id);
      if (isSelected) {
        return prevSelected.filter((u) => u.id !== user.id);
      } else {
        return [...prevSelected, { id: user.id, name: user.name }];
      }
    });
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
          {showNearbyUsers && (
            <>
              <h3 className="mt-4 text-lg font-bold">Nearby Users:</h3>
              <ul className="mt-2">
                {nearbyUsers.map(user => (
                  <li key={user.id} className="border-b py-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.some((u) => u.id === user.id)}
                      onChange={() => toggleUserSelection(user)}
                      className="mr-2"
                    />
                    {user.name} - {user.distance.toFixed(2)} km away
                    {user.preferredProviders.length > 0 && (
                      <span className="ml-2 text-sm text-gray-600">
                        (Preferred: {user.preferredProviders.join(', ')})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {selectedUsers.length >= 2 && <Chat selectedUsers={selectedUsers} />} {/* Render Chat component */}
        </motion.div>
      ) : (
        <p className="text-lg text-gray-600">No location data available.</p>
      )}
    </div>
  );
};

export default LocationTracker;
