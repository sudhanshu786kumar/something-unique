import React, { useState } from 'react';

const PreferencesModal = ({ isOpen, onClose, onUpdate, userLocation }) => {
  const [foodProviders, setFoodProviders] = useState([]);
  const [priceRange, setPriceRange] = useState('');
  const [locationRange, setLocationRange] = useState(7); // Default 7 km

  const handleApply = () => {
    onUpdate({ foodProviders, priceRange, locationRange });
    onClose();
  };

  const availableProviders = ['Zomato', 'Swiggy', 'Zepto']; // Example food providers

  const handleProviderChange = (provider) => {
    setFoodProviders((prev) => 
      prev.includes(provider) 
        ? prev.filter((p) => p !== provider) 
        : [...prev, provider]
    );
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Update Preferences</h2>
          <div>
            <label className="block mb-2 text-gray-700 dark:text-gray-300">Food Providers:</label>
            <div className="mb-4">
              {availableProviders.map(provider => (
                <div key={provider} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={provider}
                    value={provider}
                    checked={foodProviders.includes(provider)}
                    onChange={() => handleProviderChange(provider)}
                    className="mr-2"
                  />
                  <label htmlFor={provider} className="cursor-pointer text-gray-700 dark:text-gray-300">{provider}</label>
                </div>
              ))}
            </div>
            <label className="block mb-2 text-gray-700 dark:text-gray-300">Price Range:</label>
            <input
              type="text"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="e.g. 100-500"
              className="border p-2 w-full mb-4 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <label className="block mb-2 text-gray-700 dark:text-gray-300">Location Range (km):</label>
            <input
              type="number"
              value={locationRange}
              onChange={(e) => setLocationRange(e.target.value)}
              className="border p-2 w-full mb-4 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end">
            <button onClick={handleApply} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200">
              Update Preferences
            </button>
            <button onClick={onClose} className="ml-2 p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default PreferencesModal;