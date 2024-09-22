import React from 'react';

const Loader = ({ size = 'h-8 w-8' }) => {
  return (
    <div className={`flex justify-center items-center ${size}`}>
      <div className="animate-spin rounded-full h-full w-full border-t-2 border-orange-600 border-b-2"></div>
    </div>
  );
};

export default Loader;
