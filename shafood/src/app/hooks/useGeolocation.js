import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

const useLocation = () => {
  const { data: session } = useSession();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    // First try to get cached location from localStorage
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        const cacheTime = new Date(parsed.timestamp);
        const now = new Date();
        // Use cached location if it's less than 5 minutes old
        if (now - cacheTime < 5 * 60 * 1000) {
          setLocation({ latitude: parsed.latitude, longitude: parsed.longitude });
        }
      } catch (error) {
        console.error('Error parsing cached location:', error);
      }
    }

    // Function to update location in both state and backend
    const updateLocation = async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Update state immediately
      setLocation({ latitude, longitude });

      // Cache location with timestamp
      localStorage.setItem('userLocation', JSON.stringify({
        latitude,
        longitude,
        timestamp: new Date()
      }));

      try {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id, latitude, longitude }),
        });

        if (!response.ok) {
          throw new Error('Failed to update location');
        }
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    // Options for geolocation
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // Accept positions up to 5 minutes old
    };

    // Get initial position with timeout
    const timeoutId = setTimeout(() => {
      if (!location) {
        console.warn('Geolocation taking too long, trying fallback...');
        // Try to use cached location as fallback
        const cachedLocation = localStorage.getItem('userLocation');
        if (cachedLocation) {
          const parsed = JSON.parse(cachedLocation);
          setLocation({ latitude: parsed.latitude, longitude: parsed.longitude });
        }
      }
    }, 5000); // 5 seconds timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        updateLocation(position);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Error getting position:', error);
        // Try to use cached location on error
        const cachedLocation = localStorage.getItem('userLocation');
        if (cachedLocation) {
          const parsed = JSON.parse(cachedLocation);
          setLocation({ latitude: parsed.latitude, longitude: parsed.longitude });
        }
      },
      options
    );

    // Watch for location changes
    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => console.error('Error watching position:', error),
      options
    );

    // Set up Pusher connection
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe('location-updates');
    channel.bind('location-update', (data) => {
      if (data.userId === session.user.id) {
        setLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    });

    return () => {
      clearTimeout(timeoutId);
      navigator.geolocation.clearWatch(watchId);
      pusher.unsubscribe('location-updates');
    };
  }, [session]);

  return location;
};

export default useLocation;
