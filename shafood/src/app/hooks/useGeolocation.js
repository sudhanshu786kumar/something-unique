import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

const useLocation = () => {
  const { data: session } = useSession();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const handleLocationUpdate = async (position) => {
      const { latitude, longitude } = position.coords;

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

        setLocation({ latitude, longitude });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleLocationUpdate, (error) => {
      console.error('Error watching position:', error);
    });

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
      navigator.geolocation.clearWatch(watchId);
      pusher.unsubscribe('location-updates');
    };
  }, [session]);

  return location;
};

export default useLocation;
