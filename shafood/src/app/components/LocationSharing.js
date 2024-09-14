import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function LocationSharing() {
  const { data: session } = useSession();
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (session && isSharing) {
      const intervalId = setInterval(shareLocation, 60000); // Share location every minute
      return () => clearInterval(intervalId);
    }
  }, [session, isSharing]);

  const shareLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch('/api/update-user-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: latitude, lng: longitude, isSharing: true }),
            });
            if (!response.ok) {
              console.error('Failed to update location');
            }
          } catch (error) {
            console.error('Error updating location:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const toggleSharing = () => {
    setIsSharing(!isSharing);
    if (!isSharing) {
      shareLocation();
    }
  };

  return (
    <div>
      <button
        onClick={toggleSharing}
        className={`${
          isSharing ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'
        } text-white font-bold py-2 px-4 rounded`}
      >
        {isSharing ? 'Stop Sharing Location' : 'Start Sharing Location'}
      </button>
    </div>
  );
}
