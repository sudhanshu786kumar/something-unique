'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faSearch, faHome } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div
            className={`w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
              isLoaded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <FontAwesomeIcon icon={faUtensils} className="text-white text-4xl" />
          </div>
          
          <h2 
            className={`mt-6 text-center text-3xl font-extrabold text-gray-900 transition-all duration-500 delay-200 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            Oops! Page Not Found
          </h2>
          
          <p 
            className={`mt-2 text-center text-sm text-gray-600 transition-all duration-500 delay-300 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            The page you&apos;re looking for seems to have wandered off the menu.
          </p>
          
          <div 
            className={`mt-8 flex justify-center transition-all duration-500 delay-400 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
              <FontAwesomeIcon icon={faHome} className="mr-2" />
              Return Home
            </Link>
          </div>
        </div>
        
        <div 
          className={`px-6 py-4 bg-orange-500 text-white text-center transition-all duration-500 delay-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-sm">
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Lost? Try searching for delicious meals instead!
          </p>
        </div>
      </div>
    </div>
  );
}
