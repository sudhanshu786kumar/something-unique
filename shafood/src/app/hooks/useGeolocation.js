'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

const useLocation = () => {
  const { data: session } = useSession();
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    // Try to get location from localStorage first
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setLocation(parsedLocation);
        setLoadingLocation(false);
      } catch (e) {
        console.error('Error parsing saved location:', e);
      }
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Try to get address using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLocation.latitude}&lon=${newLocation.longitude}`
          );
          const data = await response.json();
          newLocation.address = data.display_name;
        } catch (error) {
          console.error('Error getting address:', error);
        }

        setLocation(newLocation);
        setLoadingLocation(false);
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
      },
      (error) => {
        setError(error.message);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
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
      pusher.unsubscribe('location-updates');
    };
  }, [session]);

  return {
    location,
    loadingLocation,
    error,
    setLocation: (newLocation) => {
      setLocation(newLocation);
      if (newLocation) {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
      }
    },
  };
};

export default useLocation;
