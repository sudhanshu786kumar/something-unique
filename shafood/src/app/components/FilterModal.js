import React, { useState } from 'react';

const FilterModal = ({ isOpen, onClose, onApply }) => {
  const [foodProviders, setFoodProviders] = useState([]);
  const [priceRange, setPriceRange] = useState('');
  const [locationRange, setLocationRange] = useState(7); // Default 7 km

  const handleApply = () => {
    onApply({ foodProviders, priceRange, locationRange });
    onClose();
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-4">Filter Users</h2>
          <div>
            <label className="block mb-2">Food Providers:</label>
            <input
              type="text"
              value={foodProviders}
              onChange={(e) => setFoodProviders(e.target.value.split(','))}
              placeholder="e.g. Zomato, Swiggy"
              className="border p-2 w-full mb-4"
            />
            <label className="block mb-2">Price Range:</label>
            <input
              type="text"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="e.g. 100-500"
              className="border p-2 w-full mb-4"
            />
            <label className="block mb-2">Location Range (km):</label>
            <input
              type="number"
              value={locationRange}
              onChange={(e) => setLocationRange(e.target.value)}
              className="border p-2 w-full mb-4"
            />
          </div>
          <button onClick={handleApply} className="bg-blue-500 text-white p-2 rounded">
            Apply Filters
          </button>
          <button onClick={onClose} className="ml-2 p-2 rounded border">
            Cancel
          </button>
        </div>
      </div>
    )
  );
};

export default FilterModal;
