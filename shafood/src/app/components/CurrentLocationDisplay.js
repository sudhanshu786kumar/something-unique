'use client';

import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faLocationDot } from '@fortawesome/free-solid-svg-icons';

const CurrentLocationDisplay = ({ location }) => {
  if (!location) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
            <FontAwesomeIcon 
              icon={faLocationDot} 
              className="text-orange-500 text-xl" 
            />
          </div>
        </div>
        <div className="flex-grow">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            Your Current Location
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
            {location.address}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentLocationDisplay;
