'use client'
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LocationTracker from '../components/LocationTracker';
import PreferencesModal from '../components/PreferencesModal';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faInfoCircle, faQuestionCircle, faSun, faMoon, faWallet } from '@fortawesome/free-solid-svg-icons';
import Loader from '../components/Loader';
// import WalletModal from '../components/WalletModal';
import Layout from '../components/Layout';


const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({ foodProviders: [], priceRange: '', locationRange: 7 });
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    setDarkMode(savedMode === 'true');
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const handleLogout = async () => {
    if (session) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
    }
    signOut();
    router.push('/login');
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

  const handleAddMoney = async (amount) => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.newBalance);
        toast.success('Money added successfully!');
      }
    } catch (error) {
      console.error('Error adding money to wallet:', error);
      toast.error('Failed to add money. Please try again.');
    }
  };

  return (
    <Layout walletBalance={walletBalance}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-100 to-red-100'}`}>
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader size="h-16 w-16" />
            </div>
          ) : (
            <LocationTracker preferences={preferences} onUpdate={handlePreferencesUpdate} session={session} />
          )}
        </main>
        <PreferencesModal
          isOpen={preferencesModalOpen}
          onClose={() => setPreferencesModalOpen(false)}
          onUpdate={handlePreferencesUpdate}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;