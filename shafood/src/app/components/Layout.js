'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faInfoCircle, faQuestionCircle, faSun, faMoon, faWallet } from '@fortawesome/free-solid-svg-icons';

const Layout = ({ children, walletBalance = 0 }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-100 to-red-100'}`}>
      <header className="bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400">ShaFood</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 p-2 rounded-full bg-orange-100 dark:bg-gray-700">
              <FontAwesomeIcon icon={faWallet} className="text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-gray-800 dark:text-white">
                ${typeof walletBalance === 'number' ? walletBalance.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center space-x-2 p-2 rounded-full bg-orange-100 dark:bg-gray-700 hover:bg-orange-200 dark:hover:bg-gray-600 transition duration-200"
              >
                <FontAwesomeIcon icon={faUser} className="text-orange-600 dark:text-orange-400" />
                <span className="hidden sm:inline text-sm text-gray-800 dark:text-white">{session?.user?.name}</span>
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
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
      <footer className="bg-white dark:bg-gray-800 shadow-inner flex-shrink-0">
        <div className="container mx-auto px-4 py-1 text-center text-gray-600 dark:text-gray-400">
          <p className="text-xs">&copy; 2024 ShaFood. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;