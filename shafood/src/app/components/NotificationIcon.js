import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const NotificationIcon = () => {
  return (
    <div className="relative">
      <FontAwesomeIcon icon={faBell} className="text-xl text-yellow-500" />
      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">!</span>
    </div>
  );
};

export default NotificationIcon;
