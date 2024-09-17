import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

const useLocation = () => {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const handleLocationUpdate = (position) => {
      const { latitude, longitude } = position.coords;
      fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id, latitude, longitude }),
      });
    };

    const watchId = navigator.geolocation.watchPosition(handleLocationUpdate);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [session]);
};

export default useLocation;
