import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useLocation from '../hooks/useGeolocation';
import CuteMap from './CuteMap';
import { motion } from 'framer-motion';

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const { data: session } = useSession();
  useLocation(); // Use the location hook

  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.userId === session?.user?.id) {
        setLocation(data);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [session]);

  const fetchUserLocations = async () => {
    try {
      const response = await fetch('/api/users/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch user locations');
      }
      const data = await response.json();
      setUserLocations(data);
    } catch (error) {
      console.error('Error fetching user locations:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {location ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-orange-600">Your Current Location</h2>
          <CuteMap latitude={location.latitude} longitude={location.longitude} />
        </motion.div>
      ) : (
        <p className="text-lg text-gray-600">No location data available.</p>
      )}

      <motion.button 
        onClick={fetchUserLocations} 
        className="mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Check All Users' Locations
      </motion.button>

      {userLocations.length > 0 && (
        <motion.div 
          className="mt-8 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-4 text-orange-600">All Users' Locations:</h3>
          <ul className="bg-white rounded-lg shadow-md overflow-hidden">
            {userLocations.map(user => (
              <motion.li 
                key={user.id} 
                className="px-4 py-3 border-b last:border-b-0 hover:bg-orange-50 transition duration-150"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="font-semibold text-gray-700">{user.name}:</span>
                {user.location ? (
                  <span className="ml-2 text-gray-600">
                    Lat: {user.location.latitude.toFixed(4)}, Lon: {user.location.longitude.toFixed(4)}
                  </span>
                ) : (
                  <span className="ml-2 text-gray-500 italic">Location not available</span>
                )}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default LocationTracker;
