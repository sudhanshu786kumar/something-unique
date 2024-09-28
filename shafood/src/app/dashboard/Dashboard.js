'use client'
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LocationTracker from '../components/LocationTracker';
import PreferencesModal from '../components/PreferencesModal';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faInfoCircle, faQuestionCircle, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({ foodProviders: [], priceRange: '', locationRange: 7 });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-100 to-red-100'}`}>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400">ShaFood</h1>
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="flex items-center space-x-2 p-2 rounded-full bg-orange-100 dark:bg-gray-700 hover:bg-orange-200 dark:hover:bg-gray-600 transition duration-200"
            >
              <FontAwesomeIcon icon={faUser} className="text-orange-600 dark:text-orange-400" />
              <span className="hidden sm:inline text-gray-800 dark:text-white">{session?.user?.name}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border dark:border-gray-700">
                <ul className="py-1">
                  <li onClick={handleLogout} className="flex items-center px-4 py-2 hover:bg-orange-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200">
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 text-orange-600 dark:text-orange-400" />
                    <span>Logout</span>
                  </li>
                  <li className="flex items-center px-4 py-2 hover:bg-orange-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-orange-600 dark:text-orange-400" />
                    <span>About</span>
                  </li>
                  <li className="flex items-center px-4 py-2 hover:bg-orange-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200">
                    <FontAwesomeIcon icon={faQuestionCircle} className="mr-2 text-orange-600 dark:text-orange-400" />
                    <span>Help</span>
                  </li>
                  <li onClick={toggleDarkMode} className="flex items-center px-4 py-2 hover:bg-orange-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200">
                    <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="mr-2 text-orange-600 dark:text-orange-400" />
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="h-16 w-16" />
          </div>
        ) : (
          <LocationTracker preferences={preferences} onUpdate={handlePreferencesUpdate} />
        )}
      </main>
      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">&copy; 2024 ShaFood. All rights reserved.</p>
        </div>
      </footer>
      <PreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        onUpdate={handlePreferencesUpdate}
      />
    </div>
  );
};

export default Dashboard;