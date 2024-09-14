'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function Map({ setNearbyUsers }) {
  const [map, setMap] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [otherUserMarkers, setOtherUserMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);
  const lastKnownPosition = useRef(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    loader.load().then(() => {
      const mapOptions = {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      };
      const newMap = new google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
    });
  }, []);

  const updateOtherUserMarkers = useCallback((users) => {
    // Remove existing markers
    otherUserMarkers.forEach(marker => marker.setMap(null));

    // Add new markers
    const newMarkers = users.map(user => {
      return new google.maps.Marker({
        position: { lat: user.lat, lng: user.lng },
        map: map,
        title: user.name,
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      });
    });

    setOtherUserMarkers(newMarkers);
  }, [map, otherUserMarkers]);

  const fetchNearbyUsers = useCallback(async (lat, lng) => {
    setIsLoading(true);
    try {
      console.log(`Fetching nearby users for lat: ${lat}, lng: ${lng}`);
      const response = await fetch(`/api/nearby-users?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const users = await response.json();
        console.log('Nearby users:', users);
        setNearbyUsers(users);
        updateOtherUserMarkers(users);
      } else {
        console.error('Failed to fetch nearby users');
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setNearbyUsers, updateOtherUserMarkers]);

  const updateUserLocation = useCallback((position) => {
    const { latitude, longitude } = position.coords;
    const latLng = new google.maps.LatLng(latitude, longitude);
    lastKnownPosition.current = { lat: latitude, lng: longitude };

    if (userMarker) {
      userMarker.setPosition(latLng);
    } else {
      const newMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: 'Your Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      });
      setUserMarker(newMarker);
    }

    map.setCenter(latLng);
    map.setZoom(14);

    fetchNearbyUsers(latitude, longitude);
  }, [map, userMarker, fetchNearbyUsers]);

  const handleGetLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(updateUserLocation, (error) => {
        console.error('Error getting location:', error);
      });
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, [updateUserLocation]);

  const handleRefresh = useCallback(() => {
    if (lastKnownPosition.current) {
      fetchNearbyUsers(lastKnownPosition.current.lat, lastKnownPosition.current.lng);
    } else {
      handleGetLocation();
    }
  }, [fetchNearbyUsers, handleGetLocation]);

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>
      <div className="absolute top-4 left-4 space-y-2">
        <button
          onClick={handleGetLocation}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get My Location
        </button>
        <button
          onClick={handleRefresh}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Nearby Users'}
        </button>
      </div>
    </div>
  );
}
