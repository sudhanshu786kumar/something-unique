'use client';

import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserFriends, 
  faUtensils, 
  faMapMarkerAlt, 
  faHeart,
  faArrowRight,
  faLocationDot
} from '@fortawesome/free-solid-svg-icons';

const WelcomeHeader = ({ session, location, router }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg border border-orange-200 dark:border-gray-700"
    >
      <div className="flex flex-col gap-6">
        {/* Welcome Text */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            {session ? `Welcome back, ${session.user.name}!` : 'Welcome to ShaFood'}
          </h1>
          
          {/* Location Display */}
          {location && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
            >
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <FontAwesomeIcon icon={faLocationDot} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm">Your current location</p>
                <p className="text-base font-medium">{location.address}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Features Grid for Guest Users */}
        {!session && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 max-w-xl">
              Connect with nearby food enthusiasts who share your taste! Join our community to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <FontAwesomeIcon icon={faUserFriends} className="text-orange-500" />
                </div>
                <span>Find nearby food buddies</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <FontAwesomeIcon icon={faUtensils} className="text-orange-500" />
                </div>
                <span>Share group orders</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                </div>
                <span>Discover local favorites</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <FontAwesomeIcon icon={faHeart} className="text-orange-500" />
                </div>
                <span>Save on delivery fees</span>
              </div>
            </div>
          </div>
        )}

        {/* Auth Buttons for Guest Users */}
        {!session && (
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              Get Started
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-orange-500 border border-orange-500 rounded-xl hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
            >
              Sign Up
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default WelcomeHeader;
