import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';

const NearbyUsersDrawer = ({ isOpen, onClose, users, onSelectUser, getProviderIcon, selectedUsers, onOpenChat }) => {
  const { data: session } = useSession();
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 h-3/4 bg-white dark:bg-gray-800 shadow-lg z-50 overflow-y-auto rounded-t-3xl"
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-orange-600 dark:text-orange-400">Nearby Users</h2>
          <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        <ul className="space-y-4 mb-20">
          {users
          .filter(user => user.id !== session.user.id).map(user => (
            <li key={user.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-200 dark:bg-orange-700 rounded-full flex items-center justify-center mr-3">
                  {user.preferredProviders.length > 0 ? (
                    getProviderIcon(user.preferredProviders[0])
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.distance.toFixed(2)} km away</p>
                </div>
              </div>
              <button
                onClick={() => onSelectUser(user)}
                className={`px-3 py-1 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300 ${
                  selectedUsers.some((selectedUser) => selectedUser.id === user.id)
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : ''
                }`}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onOpenChat}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition duration-300 shadow-lg hover:shadow-xl"
          >
            Open Chat ({selectedUsers.length})
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NearbyUsersDrawer;