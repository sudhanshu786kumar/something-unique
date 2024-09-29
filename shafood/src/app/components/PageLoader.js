'use client';

import React, { useState, useEffect } from 'react';
import Loader from './Loader';

const PageLoader = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust this time as needed

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100 z-50">
        <Loader size="h-32 w-32" />
      </div>
    );
  }

  return <>{children}</>;
};

export default PageLoader;
