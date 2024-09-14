'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function Map({ setNearbyUsers }) {
  const [map, setMap] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [nearbyUsersMarkers, setNearbyUsersMarkers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);

  const initMap = useCallback(async () => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    const google = await loader.load();
    const mapInstance = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 0, lng: 0 },
      zoom: 2,
    });

    setMap(mapInstance);
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  const fetchNearbyUsers = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(`/api/nearby-users?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        setNearbyUsers(data);
        return data;
      } else {
        console.error('Failed to fetch nearby users');
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    }
  }, [setNearbyUsers]);

  const updateNearbyUsersMarkers = useCallback((users) => {
    nearbyUsersMarkers.forEach(marker => marker.setMap(null));
    const newMarkers = users.map(user => {
      const marker = new google.maps.Marker({
        position: { lat: user.lat, lng: user.lng },
        map: map,
        title: user.name,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${user.name}</strong>${user.isOrdering ? '<br>Currently ordering' : ''}</div>`,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setNearbyUsersMarkers(newMarkers);
  }, [map, nearbyUsersMarkers]);

  const handleSearchNearby = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = { lat: latitude, lng: longitude };

          map.setCenter(latLng);
          map.setZoom(15);

          if (userMarker) {
            userMarker.setPosition(latLng);
          } else {
            const newMarker = new google.maps.Marker({
              position: latLng,
              map: map,
              title: 'Your Location',
              icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            });
            setUserMarker(newMarker);
          }

          const nearbyUsers = await fetchNearbyUsers(latitude, longitude);
          if (nearbyUsers) {
            updateNearbyUsersMarkers(nearbyUsers);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please check your browser settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }, [map, userMarker, fetchNearbyUsers, updateNearbyUsersMarkers]);

  const handleShareLocation = useCallback(async () => {
    setIsSharing(!isSharing);
    if (!isSharing && userMarker) {
      const position = userMarker.getPosition();
      await fetch('/api/update-user-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: position.lat(), lng: position.lng(), isSharing: true }),
      });
    } else {
      await fetch('/api/update-user-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSharing: false }),
      });
    }
  }, [isSharing, userMarker]);

  return (
    <div className="relative">
      <div id="map" style={{ height: '400px', width: '100%' }}></div>
      <div className="absolute top-4 left-4 space-y-2">
        <button
          onClick={handleSearchNearby}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Search Nearby
        </button>
        <button
          onClick={handleShareLocation}
          className={`${isSharing ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} text-white font-bold py-2 px-4 rounded`}
        >
          {isSharing ? 'Stop Sharing' : 'Share Location'}
        </button>
      </div>
    </div>
  );
}
