import { getDefaultAvatar } from '@/app/utils/avatarUtils';
import Image from 'next/image';

const Avatar = ({ user, size = 'md', showOnline = false, onlineStatus = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className="relative">
      <img
        src={user.image || getDefaultAvatar(user.email)}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover bg-orange-50 dark:bg-gray-700`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getDefaultAvatar(user.email);
        }}
      />
      {showOnline && onlineStatus && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
      )}
    </div>
  );
};

export default Avatar; 