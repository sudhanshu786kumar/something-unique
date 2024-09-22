'use client'
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Import useRouter
import LocationTracker from '../components/LocationTracker';
import PreferencesModal from '../components/PreferencesModal';
import { toast } from 'react-toastify'; // Import toast for notifications
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { data: session, status } = useSession(); // Get session and status
  const router = useRouter(); // Initialize useRouter
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({ foodProviders: [], priceRange: '', locationRange: 7 });
  const [loading, setLoading] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Redirect to sign-in page if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login'); // Redirect to sign-in page
    }
  }, [status, router]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
    }

    const handleBeforeUnload = async () => {
      if (session) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }), // Include user ID
        });
      }
    };

    const handleOffline = async () => {
      if (session) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }), // Include user ID
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('offline', handleOffline);
    };
  }, [session]);

  const handleLogout = async () => {
    if (session) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }), // Include user ID
      });
    }
    signOut(); // Call signOut to update session
    router.push('/login'); // Redirect to the login page
  };

  const handlePreferencesUpdate = async (newPreferences) => {
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id, // Ensure userId is included
          ...newPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setPreferences(newPreferences);
      toast.success('Preferences updated successfully!'); // Show success notification
    } catch (error) {
      console.error('Error updating preferences:', error); // Log the error for debugging
      toast.error('Failed to update preferences.'); // Show error notification
    }
  };

  // const fetchNearbyUsers = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch(`/api/users/nearby?latitude=${session.user.latitude}&longitude=${session.user.longitude}`);
  //     const data = await response.json();
  //     if (response.ok) {
  //       setNearbyUsers(data);
  //     } else {
  //       toast.error('Failed to fetch nearby users.');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching nearby users:', error);
  //     toast.error('Error fetching nearby users.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleUserSelection = (userId) => {
  //   setSelectedUsers((prevSelected) => {
  //     if (prevSelected.includes(userId)) {
  //       return prevSelected.filter((id) => id !== userId);
  //     } else {
  //       return [...prevSelected, userId];
  //     }
  //   });
  // };

  // const navigateToGroupChat = () => {
  //   if (selectedUsers.length > 0) {
  //     router.push({
  //       pathname: '/group-chat',
  //       query: { users: JSON.stringify(selectedUsers) },
  //     });
  //   } else {
  //     toast.error('Please select at least one user.');
  //   }
  // };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-100 to-red-100'} transition duration-300`}>
      <header className="flex justify-between items-center p-4 shadow-md">
        <h1 className="text-2xl font-bold">ShaFood</h1>
        <div className="flex-grow text-center">
          <p className="text-sm text-gray-600">Share delicious moments with friends</p>
        </div>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center p-2 rounded bg-gray-200 hover:bg-gray-300 transition duration-200">
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            {session?.user?.name}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <ul className="py-1">
                <li onClick={handleLogout} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Logout
                </li>
                <li className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                  About
                </li>
                <li className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                  Help
                </li>
                <li className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={toggleDarkMode}>
                  <span className="mr-2">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>
      <main className="p-4">
        <LocationTracker preferences={preferences} onUpdate={handlePreferencesUpdate}  />
      </main>
      <footer className="p-4 text-center border-t">
        <p className="text-sm">© 2024 ShaFood. All rights reserved.</p>
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