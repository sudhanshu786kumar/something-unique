import React, { useState } from 'react';

const OrderModal = ({ isOpen, onClose, selectedUsers }) => {
  const [selectedProvider, setSelectedProvider] = useState('');

  const handleOrder = () => {
    // Logic to handle ordering with the selected provider and users
    console.log('Ordering with:', selectedProvider, 'for users:', selectedUsers);
    onClose();
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-4">Order Together</h2>
          <div>
            <label className="block mb-2">Select Food Provider:</label>
            <select 
              value={selectedProvider} 
              onChange={(e) => setSelectedProvider(e.target.value)} 
              className="border p-2 w-full mb-4"
            >
              <option value="">Select a provider</option>
              <option value="Zomato">Zomato</option>
              <option value="Swiggy">Swiggy</option>
              {/* Add more providers as needed */}
            </select>
          </div>
          <button onClick={handleOrder} className="bg-blue-500 text-white p-2 rounded">
            Order
          </button>
          <button onClick={onClose} className="ml-2 p-2 rounded border">
            Cancel
          </button>
        </div>
      </div>
    )
  );
};

export default OrderModal;
