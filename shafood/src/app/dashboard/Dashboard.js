'use client'
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LocationTracker from '../components/LocationTracker';
import PreferencesModal from '../components/PreferencesModal';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({ foodProviders: [], priceRange: '', locationRange: 7 });
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchWalletBalance();
      fetchUserPreferences();
    }
  }, [status, router]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance);
      } else {
        console.error('Failed to fetch wallet balance:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/users/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setLoading(false);
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
      toast.success('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences.');
    }
  };

  return (
    <Layout walletBalance={walletBalance}>
      <div className="w-full h-full">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader size="h-16 w-16" />
          </div>
        ) : (
          <LocationTracker preferences={preferences} onUpdate={handlePreferencesUpdate} session={session} />
        )}
      </div>
      <PreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        onUpdate={handlePreferencesUpdate}
      />
    </Layout>
  );
};

export default Dashboard;
