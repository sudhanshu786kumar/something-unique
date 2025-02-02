import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faCheck, faLock, faComments, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const NearbyUsersDrawer = ({ isOpen, onClose, users, onSelectUser, getProviderIcon, selectedUsers }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const formatDistance = (distance) => {
    const dist = typeof distance === 'number' ? distance : parseFloat(distance);
    return isNaN(dist) ? '0.0' : dist.toFixed(1);
  };

  const handleUserAction = (action) => {
    if (!session) {
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <FontAwesomeIcon 
                icon={faLock} 
                className="text-orange-500 text-xl"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Login Required
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                To {action} with nearby users, please login or create an account.
              </p>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => {
                    localStorage.setItem('postLoginAction', action);
                    router.push('/login');
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('postLoginAction', action);
                    router.push('/register');
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-2 bg-white text-orange-500 text-sm rounded-lg border border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  Register
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'bottom-center',
      });
      return;
    }
    
    // If user is logged in, proceed with the action
    if (action === 'chat') {
      handleOpenChat();
    } else if (action === 'order') {
      // Handle order process
    }
  };

  const handleOpenChat = () => {
    const chatUsers = selectedUsers.filter(user => user.id !== session?.user?.id);
    
    router.push(`/chat?users=${encodeURIComponent(JSON.stringify(chatUsers))}`);
    
    onClose();
  };

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
            .filter(user => user.id !== session?.user?.id)
            .map(user => (
              <li key={user.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-gray-700 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-200 dark:bg-orange-700 rounded-full flex items-center justify-center mr-3">
                    {user.preferredProviders?.length > 0 ? (
                      getProviderIcon(user.preferredProviders[0])
                    ) : (
                      <FontAwesomeIcon icon={faUser} className="text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDistance(user.distance)} km away
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onSelectUser(user)}
                  className={`px-3 py-1 rounded-full transition duration-300 flex items-center justify-center w-24
                    ${selectedUsers.some((selectedUser) => selectedUser.id === user.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                >
                  {selectedUsers.some((selectedUser) => selectedUser.id === user.id) ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Selected
                    </>
                  ) : (
                    'Select'
                  )}
                </button>
              </li>
            ))}
        </ul>
      </div>
      {selectedUsers.length > 0 && (
        <div className="sticky bottom-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={() => handleUserAction('chat')}
              className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faComments} />
              Start Chat ({selectedUsers.length})
            </button>
            <button
              onClick={() => handleUserAction('order')}
              className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faShoppingBag} />
              Start Order
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NearbyUsersDrawer;
