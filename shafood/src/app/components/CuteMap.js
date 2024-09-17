import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader } from '@googlemaps/js-api-loader';

const CuteMap = ({ latitude, longitude }) => {
  const mapRef = useRef(null);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    loader.load().then(() => {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          {
            featureType: 'all',
            elementType: 'all',
            stylers: [{ saturation: -100 }, { hue: '#ff8d00' }]
          }
        ]
      });

      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        icon: {
          url: '/cute-food-icon.png',
          scaledSize: new google.maps.Size(40, 40),
        },
      });

      // Get location name
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            setLocationName(results[0].formatted_address);
          }
        }
      });
    });
  }, [latitude, longitude]);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-64 h-64 rounded-full overflow-hidden shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          boxShadow: '0 0 20px rgba(255, 165, 0, 0.5)',
        }}
      >
        <div ref={mapRef} className="w-full h-full" />
      </motion.div>
      {locationName && (
        <motion.p
          className="mt-4 text-sm font-semibold text-orange-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {locationName}
        </motion.p>
      )}
    </div>
  );
};

export default CuteMap;
