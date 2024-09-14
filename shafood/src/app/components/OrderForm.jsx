'use client';

import { useState } from 'react';

export default function OrderForm() {
  const [platform, setPlatform] = useState('');
  const [items, setItems] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement order creation logic
    console.log('Order submitted:', { platform, items });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <label htmlFor="platform" className="block text-sm font-medium text-gray-700">Delivery Platform</label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a platform</option>
          <option value="zomato">Zomato</option>
          <option value="blinkit">Blinkit</option>
          <option value="zepto">Zepto</option>
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="items" className="block text-sm font-medium text-gray-700">Items</label>
        <textarea
          id="items"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          rows={3}
          className="mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
          placeholder="Enter your order items"
        ></textarea>
      </div>
      <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Place Order
      </button>
    </form>
  );
}
