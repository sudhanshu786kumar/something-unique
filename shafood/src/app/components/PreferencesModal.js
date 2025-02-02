import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faMapMarkerAlt, faMoneyBill, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

const PreferencesModal = ({ isOpen, onClose, onUpdate, userLocation, className }) => {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState({
    foodProviders: [],
    priceRange: '',
    locationRange: 7
  });
  const [customProvider, setCustomProvider] = useState('');

  const foodProviderOptions = ['Swiggy', 'Zomato', 'UberEats'];
  const priceRangeOptions = ['₹0-200', '₹200-500', '₹500-1000', '₹1000+'];

  const handleAddCustomProvider = (e) => {
    e.preventDefault();
    if (customProvider.trim()) {
      if (!preferences.foodProviders.includes(customProvider.trim())) {
        setPreferences(prev => ({
          ...prev,
          foodProviders: [...prev.foodProviders, customProvider.trim()]
        }));
      }
      setCustomProvider('');
    }
  };

  const handleRemoveProvider = (provider) => {
    setPreferences(prev => ({
      ...prev,
      foodProviders: prev.foodProviders.filter(p => p !== provider)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate preferences before sending
    if (preferences.foodProviders.length === 0) {
      toast.error('Please select at least one food provider');
      return;
    }

    if (!preferences.priceRange) {
      toast.error('Please select a price range');
      return;
    }

    try {
      // Call onUpdate with the new preferences
      onUpdate({
        foodProviders: preferences.foodProviders,
        priceRange: preferences.priceRange,
        locationRange: Number(preferences.locationRange)
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1900]"
        onClick={onClose}
      />
      
      <div className={`fixed inset-0 flex items-center justify-center z-[2000] ${className}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Set Your Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your food delivery preferences to find better matches
              </p>
            </div>

            {/* Food Providers */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Food Providers
              </label>
              
              {/* Custom Provider Input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={customProvider}
                  onChange={(e) => setCustomProvider(e.target.value)}
                  placeholder="Add custom provider"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomProvider}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600
                           transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add
                </button>
              </div>

              {/* Provider Tags */}
              <div className="flex flex-wrap gap-2">
                {/* Default Providers */}
                {foodProviderOptions.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => {
                      setPreferences(prev => ({
                        ...prev,
                        foodProviders: prev.foodProviders.includes(provider)
                          ? prev.foodProviders.filter(p => p !== provider)
                          : [...prev.foodProviders, provider]
                      }));
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      preferences.foodProviders.includes(provider)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUtensils} className="mr-2" />
                    {provider}
                  </button>
                ))}

                {/* Custom Providers */}
                {preferences.foodProviders
                  .filter(provider => !foodProviderOptions.includes(provider))
                  .map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => handleRemoveProvider(provider)}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-orange-500 text-white
                               hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faUtensils} className="mr-1" />
                      {provider}
                      <FontAwesomeIcon icon={faTimes} className="ml-1" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Location Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location Range (km)
              </label>
              <div className="flex items-center gap-4">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={preferences.locationRange}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    locationRange: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer dark:bg-orange-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3ch]">
                  {preferences.locationRange}
                </span>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {priceRangeOptions.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setPreferences(prev => ({
                      ...prev,
                      priceRange: range
                    }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      preferences.priceRange === range
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <FontAwesomeIcon icon={faUtensils} />
              Save Preferences
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default PreferencesModal;