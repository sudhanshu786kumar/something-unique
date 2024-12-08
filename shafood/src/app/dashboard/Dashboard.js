'use client'
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LocationTracker from '../components/LocationTracker';
import PreferencesModal from '../components/PreferencesModal';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Layout from '../components/Layout';
import Pusher from 'pusher-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import useGeolocation from '../hooks/useGeolocation';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({ foodProviders: [], priceRange: '', locationRange: 7 });
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const location = useGeolocation();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInitialData();
    }
  }, [status, router]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const userData = await response.json();
        console.log('Wallet API Response:', userData);
        setWalletBalance(userData.walletBalance);
        setUserDetails(userData);

        if (userData.preferences) {
          console.log('Setting preferences:', userData.preferences);
          setPreferences(userData.preferences);
          if (location) {
            await fetchNearbyUsers(userData.preferences, location);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location && preferences && !loading) {
      fetchNearbyUsers(preferences, location);
    }
  }, [location, preferences, loading]);

  const fetchNearbyUsers = async (userPreferences, userLocation) => {
    if (!userPreferences?.locationRange || !userLocation?.latitude) return;
    
    setLoadingNearbyUsers(true);
    try {
      const response = await fetch(
        `/api/users/nearby?` + 
        `latitude=${userLocation.latitude}&` +
        `longitude=${userLocation.longitude}&` +
        `radius=${userPreferences.locationRange}&` +
        `providers=${userPreferences.foodProviders.join(',')}&` +
        `priceRange=${userPreferences.priceRange}`
      );

      if (response.ok) {
        const data = await response.json();
        setNearbyUsers(data);
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      toast.error('Failed to fetch nearby users');
    } finally {
      setLoadingNearbyUsers(false);
    }
  };

  const handlePreferencesUpdate = async (newPreferences) => {
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, ...newPreferences }),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      setPreferences(newPreferences);
      // Fetch nearby users with new preferences using current location
      if (userDetails?.location) {
        await fetchNearbyUsers(newPreferences, userDetails.location);
      }
      toast.success('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences.');
    }
  };

  // Add Pusher subscription for real-time messages
  useEffect(() => {
    if (!session?.user?.id) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusher.subscribe(`user-${session.user.id}`);
    
    channel.bind('new-message', (data) => {
      if (data.sender !== session.user.name) {
        // Play notification sound
        const notificationSound = new Audio('/notification.mp3');
        notificationSound.play().catch(err => console.error('Error playing sound:', err));

        // Show enhanced toast notification
        toast(
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-start space-x-4 p-1"
          >
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faComments} className="text-white text-lg" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="text-white text-xs" />
                </motion.div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <p className="font-semibold text-gray-900 dark:text-white">
                  {data.sender}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {data.text}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chat?chatId=${data.chatId}`);
                    }}
                    className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-full transition-colors"
                  >
                    Reply
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>,
          {
            position: "bottom-right",
            autoClose: 7000,
            hideProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            className: "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
            style: {
              minWidth: '350px',
              padding: '0'
            },
            onClick: () => {
              router.push(`/chat?chatId=${data.chatId}`);
            }
          }
        );
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id]);

  return (
    <Layout walletBalance={walletBalance}>
      <div className="w-full h-full">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader size="h-16 w-16" />
          </div>
        ) : (
          <div className="p-4">
            <LocationTracker 
              preferences={preferences}
              onUpdate={handlePreferencesUpdate}
              session={session}
              initialNearbyUsers={nearbyUsers}
              loadingNearbyUsers={loadingNearbyUsers}
              setLoadingNearbyUsers={setLoadingNearbyUsers}
              userLocation={location}
              isPreferencesSet={!!userDetails?.preferences}
              initialPreferences={userDetails?.preferences}
            />
          </div>
        )}
      </div>
      <PreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        onUpdate={handlePreferencesUpdate}
        initialPreferences={preferences}
        userLocation={location}
      />
    </Layout>
  );
};

export default Dashboard;
