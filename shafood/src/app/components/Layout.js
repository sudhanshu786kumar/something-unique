'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faInfoCircle, faQuestionCircle, faWallet } from '@fortawesome/free-solid-svg-icons';
import DarkModeToggle from './DarkModeToggle';

const Layout = ({ children, walletBalance = 0 }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <DarkModeToggle />
            <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400 ml-4">ShaFood</h1>
          </div>
          {session && (
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <FontAwesomeIcon icon={faWallet} className="mr-2" />
                ${walletBalance.toFixed(2)}
              </div>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faUser} />
                  <span className="hidden sm:inline">{session.user.name}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                      Logout
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                      About
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                      Help
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      <main className="flex-grow w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
