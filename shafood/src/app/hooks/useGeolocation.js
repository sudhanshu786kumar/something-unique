import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

const useLocation = () => {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const handleLocationUpdate = async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // Send location to the server
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

        // Optionally, trigger a Pusher event here if needed
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        pusher.trigger('location-updates', 'location-update', {
          userId: session.user.id,
          latitude,
          longitude,
        });

      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleLocationUpdate, (error) => {
      console.error('Error watching position:', error);
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [session]);
};

export default useLocation;
