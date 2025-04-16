"use client"
import { useEffect, useState } from 'react'
import { Providers } from '../providers'
import Dashboard from './Dashboard'
import EnableLocation from '../components/EnableLocation';

export default function Page() {
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationEnabled(true),
        () => setLocationEnabled(false)
      );
    } else {
      setLocationEnabled(false);
    }
  }, []);

  return (
    <Providers>
      {locationEnabled ? (
        <Dashboard />
      ) : (
       <EnableLocation/>
      )}
    </Providers>
  );
}