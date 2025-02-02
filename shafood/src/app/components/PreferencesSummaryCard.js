'use client';

import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUtensils, 
  faCog, 
  faMoneyBill,
  faLocationDot,
  faEdit
} from '@fortawesome/free-solid-svg-icons';

const PreferencesSummaryCard = ({ preferences, onUpdateClick }) => {
  if (!preferences) return null;

  const getProviderIcon = (provider) => {
    const providerIcons = {
      Zomato: faUtensils,
      Swiggy: faUtensils,
      Zepto: faUtensils,
      UberEats: faUtensils,
    };
    return providerIcons[provider] || faUtensils;
  };

  const getPriceRangeLabel = (range) => {
    const ranges = {
      'budget': 'Budget Friendly',
      'mid': 'Mid Range',
      'premium': 'Premium'
    };
    return ranges[range] || range;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faCog} className="text-orange-500" />
              Your Preferences
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customize these to find better matches
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpdateClick}
            className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors"
          >
            <FontAwesomeIcon icon={faEdit} />
            Update
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Food Providers */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Food Providers
            </h3>
            <div className="flex flex-wrap gap-2">
              {preferences.foodProviders.map(provider => (
                <span 
                  key={provider}
                  className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg text-sm flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={getProviderIcon(provider)} />
                  {provider}
                </span>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Price Range
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faMoneyBill} />
                {getPriceRangeLabel(preferences.priceRange)}
              </span>
            </div>
          </div>

          {/* Location Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Search Radius
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} />
                {preferences.locationRange || 7} km
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PreferencesSummaryCard;