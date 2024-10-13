'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faShoppingBasket, faCartPlus, faComments, faSpinner, faBars, faArrowLeft, faTimes, faRefresh } from '@fortawesome/free-solid-svg-icons';
import Chat from './Chat';
import DOMPurify from 'dompurify';
import OrderProcess from './OrderProcess';

const ProviderContent = ({ provider }) => {
  const [currentUrl, setCurrentUrl] = useState(`/api/provider/${provider}`);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const iframeRef = useRef(null);

  const handleNavigation = useCallback((url) => {
    setCurrentUrl(`/api/provider/${provider}?url=${encodeURIComponent(url)}`);
    setLoading(true);
    setError(null);
    setContent(null);
  }, [provider]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(currentUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [currentUrl]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 p-2 flex items-center">
        <button 
          onClick={() => handleNavigation(`/api/provider/${provider}`)}
          className="mr-4 text-blue-500 hover:text-blue-600 transition duration-300"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <input 
          type="text" 
          value={currentUrl.split('url=')[1] || ''}
          onChange={(e) => handleNavigation(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigation(e.target.value)}
          className="flex-grow p-1 border rounded"
        />
        <button 
          onClick={() => handleNavigation(currentUrl.split('url=')[1] || '')}
          className="ml-4 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition duration-300"
        >
          Go
        </button>
      </div>
      <div className="relative flex-grow">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={() => handleNavigation(currentUrl)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                Retry
              </button>
            </div>
          </div>
        )}
        {content && (
          <iframe 
            ref={iframeRef}
            srcDoc={content}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};

const ChatPageContent = ({ initialSelectedUsers }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatId, setChatId] = useState('');
  const [nearbyUsers, setNearbyUsers] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  // If still loading or not authenticated, don't render the content
  if (status === 'loading' || status === 'unauthenticated') {
    return <div>Loading...</div>;
  }

  const providerUrls = {
    Zepto: 'https://www.zeptonow.com/',
    Zomato: 'https://www.zomato.com/',
    Swiggy: 'https://www.swiggy.com/',
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
  }, [session]);

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
    if (activeTab === 'order' && !chatId) {
      // Generate or fetch chatId here
      const generateChatId = async () => {
        // Example: fetch chatId from an API
        const response = await fetch('/api/generateChatId');
        const data = await response.json();
        setChatId(data.chatId);
      };
      generateChatId();
    }
  }, [activeTab, chatId]);

  useEffect(() => {
    // Fetch nearby users
    const fetchNearbyUsers = async () => {
      try {
        const response = await fetch('/api/nearbyUsers');
        const data = await response.json();
        setNearbyUsers(data);
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      }
    };

    fetchNearbyUsers();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <header className="bg-orange-100 dark:bg-gray-700 p-2 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-orange-600 dark:text-orange-400"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="text-xl font-semibold text-orange-600 dark:text-orange-400">Chat</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-orange-600 dark:text-orange-400 md:hidden"
        >
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} size="lg" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className={`${isMobileMenuOpen ? 'absolute inset-0 z-10' : 'hidden'} md:relative md:block w-full md:w-1/4 bg-orange-50 dark:bg-gray-800 overflow-y-auto`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-orange-600 dark:text-orange-400">Menu</h3>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-orange-200 dark:bg-orange-600'
                      : 'hover:bg-orange-200 dark:hover:bg-orange-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faComments} className="mr-2 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-800 dark:text-white">Group Chat</span>
                </button>
              </li>
              <li>
                <h4 className="text-md font-semibold mb-2 text-gray-600 dark:text-gray-400">Providers</h4>
                <ul className="space-y-2">
                  {combinedProviders.map(provider => (
                    <li key={provider}>
                      <button
                        onClick={() => {
                          setActiveTab('provider');
                          setSelectedProvider(provider);
                          setIsMobileMenuOpen(false);
                          window.open(providerUrls[provider], '_blank');
                        }}
                        className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                          activeTab === 'provider' && selectedProvider === provider
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
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('order')}
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    activeTab === 'order'
                      ? 'bg-orange-200 dark:bg-orange-600'
                      : 'hover:bg-orange-200 dark:hover:bg-orange-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faUtensils} className="mr-2 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-800 dark:text-white">Process Order</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <Chat
              selectedUsers={allSelectedUsers}
              onUpdateSelectedUsers={handleUpdateSelectedUsers}
              onChatIdChange={setChatId}
              nearbyUsers={nearbyUsers}
              onClose={() => setActiveTab('chat')}
            />
          )}
          {activeTab === 'provider' && selectedProvider && (
            <div className="h-full flex items-center justify-center">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Redirecting to {selectedProvider}...
              </p>
            </div>
          )}
          {activeTab === 'order' && (
            <OrderProcess
              chatId={chatId}
              users={allSelectedUsers}
              currentUserId={session?.user?.id}
              onClose={() => setActiveTab('chat')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPageContent;
