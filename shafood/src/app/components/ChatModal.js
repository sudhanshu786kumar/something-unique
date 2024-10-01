import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUtensils, faShoppingBasket, faCartPlus, faComments, faSpinner, faBars } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';
import Chat from './Chat';

const ChatModal = ({ isOpen, onClose, selectedUsers: initialSelectedUsers, nearbyUsers, onUpdateSelectedUsers }) => {
  const { data: session } = useSession();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const providerUrls = {
    Zepto: '/api/proxy/Zepto',
    Zomato: '/api/proxy/Zomato',
    Swiggy: '/api/proxy/Swiggy',
  };

  const getProviderIcon = (provider) => {
    const providerIcons = {
      Zomato: faUtensils,
      Swiggy: faShoppingBasket,
      Zepto: faCartPlus,
    };
    return providerIcons[provider] || faUtensils;
  };

  const handleUpdateSelectedUsers = useCallback((updatedUsers) => {
    setSelectedUsers(updatedUsers.filter(user => user.id !== session?.user?.id));
    onUpdateSelectedUsers(updatedUsers);
  }, [session, onUpdateSelectedUsers]);

  const allSelectedUsers = useMemo(() => {
    if (!session?.user) return selectedUsers;
    const loggedInUser = {
      id: session.user.id,
      name: session.user.name,
    };
    return [loggedInUser, ...selectedUsers.filter(user => user.id !== session.user.id)];
  }, [selectedUsers, session]);

  const combinedProviders = useMemo(() => {
    const allProviders = allSelectedUsers.flatMap(user => user.preferredProviders || []);
    return [...new Set(allProviders)];
  }, [allSelectedUsers]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
    setRetryCount(0);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
    if (retryCount < 3) {
      setRetryCount(prevCount => prevCount + 1);
      setTimeout(() => {
        setIsLoading(true);
        setIframeError(false);
      }, 2000);
    }
  };

  useEffect(() => {
    if (selectedProvider) {
      setIsLoading(true);
      setIframeError(false);
      setRetryCount(0);
    }
  }, [selectedProvider]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'pointer-events-none'}`}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col md:flex-row overflow-hidden"
      >
        {/* Mobile menu button */}
        <div className="md:hidden p-4 bg-orange-100 dark:bg-gray-700">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-orange-600 dark:text-orange-400"
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
        </div>

        {/* Left menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-1/4 bg-orange-100 dark:bg-gray-700 p-4 overflow-y-auto`}>
          <h3 className="text-lg font-semibold mb-4 text-orange-600 dark:text-orange-400">Menu</h3>
          <ul className="space-y-2">
            <li className="flex items-center">
              <button
                onClick={() => {
                  setSelectedProvider(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                  selectedProvider === null
                    ? 'bg-orange-200 dark:bg-orange-600'
                    : 'hover:bg-orange-200 dark:hover:bg-orange-600'
                }`}
              >
                <FontAwesomeIcon icon={faComments} className="mr-2 text-orange-600 dark:text-orange-400" />
                <span className="text-gray-800 dark:text-white">Chat</span>
              </button>
            </li>
            {combinedProviders.map(provider => (
              <li key={provider} className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedProvider(provider);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    selectedProvider === provider
                      ? 'bg-orange-200 dark:bg-orange-600'
                      : 'hover:bg-orange-200 dark:hover:bg-orange-600'
                  }`}
                >
                  <FontAwesomeIcon icon={getProviderIcon(provider)} className="mr-2 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-800 dark:text-white">{provider}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {selectedProvider ? (
              isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500" />
                </div>
              ) : iframeError ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-red-500">Failed to load content. Please try again later.</p>
                </div>
              ) : (
                <iframe
                  key={`${selectedProvider}-${retryCount}`}
                  src={`${providerUrls[selectedProvider]}?t=${Date.now()}`}
                  className="w-full h-full border-none"
                  title={`${selectedProvider} Web View`}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              )
            ) : (
              <Chat 
                selectedUsers={allSelectedUsers} 
                onClose={onClose} 
                nearbyUsers={nearbyUsers} 
                loggedInUserId={session?.user?.id}
                onUpdateSelectedUsers={handleUpdateSelectedUsers}
              />
            )}
          </div>
          <div className="p-4 bg-orange-50 dark:bg-gray-700">
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatModal;