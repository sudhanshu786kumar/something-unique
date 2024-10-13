import React, { createContext, useContext, useState } from 'react';

const NearbyUsersContext = createContext();

export const NearbyUsersProvider = ({ children }) => {
  const [nearbyUsers, setNearbyUserFor] = useState([]);

  return (
    <NearbyUsersContext.Provider value={{ nearbyUsers, setNearbyUserFor }}>
      {children}
    </NearbyUsersContext.Provider>
  );
};

export const useNearbyUsers = () => {
  const context = useContext(NearbyUsersContext);
  console.log('NearbyUsersContext value:', context);
  if (context === undefined) {
    throw new Error('useNearbyUsers must be used within a NearbyUsersProvider');
  }
  return context;
};
