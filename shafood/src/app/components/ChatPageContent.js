'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faShoppingBasket, faCartPlus, faComments, faBars, faTimes, faBell } from '@fortawesome/free-solid-svg-icons';
import Chat from './Chat';
import OrderProcess from './OrderProcess';
import { useTheme } from 'next-themes';
import Pusher from 'pusher-js';

const ChatPageContent = ({ initialSelectedUsers }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatId, setChatId] = useState('');
  const { theme, setTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Add this after the state declarations
  const uniqueUsers = Array.from(new Set(selectedUsers.map(user => JSON.stringify(user))))
    .map(userString => JSON.parse(userString));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/dashboard');
    }

    // Initialize Pusher and subscribe to the presence channel
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: `/api/pusher/auth`,
    });

    const presenceChannel = pusher.subscribe(`presence-chat-${chatId}`);
    
    presenceChannel.bind('pusher:subscription_succeeded', (members) => {
      setOnlineUsers(new Set(Object.keys(members.members)));
    });

    presenceChannel.bind('pusher:member_added', (member) => {
      setOnlineUsers((prev) => new Set(prev).add(member.id));
    });

    presenceChannel.bind('pusher:member_removed', (member) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(member.id);
        return newSet;
      });
    });

    return () => {
      pusher.unsubscribe(`presence-chat-${chatId}`);
    };
  }, [status, router, chatId]);

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
      UberEats: faCartPlus,
    };
    return providerIcons[provider] || faUtensils;
  };

  const combinedProviders = [...new Set(selectedUsers.flatMap(user => user.preferredProviders))];

  const renderMobileMenu = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-4/5 max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Menu</h3>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => {
              setActiveTab('chat');
              setShowMobileMenu(false);
            }}
            className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Chats
          </button>
          <button
            onClick={() => {
              setActiveTab('groups');
              setShowMobileMenu(false);
            }}
            className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Groups
          </button>
          {/* Add more menu items as needed */}
        </div>
      </div>
    </div>
  );

  const handleCloseChat = () => {
    // Define what should happen when the chat is closed
    // For example, you might want to reset some state or navigate to a different page
    setActiveTab('dashboard'); // Assuming you have a dashboard tab
    setChatId('');
    setSelectedUsers([]);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400">Group Chat</h1>
          <div className="flex items-center">
            {unreadMessages > 0 && (
              <div className="mr-4 relative">
                <FontAwesomeIcon icon={faBell} className="text-orange-500" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 dark:text-gray-400"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} size="lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className={`${isMobileMenuOpen ? 'fixed inset-0 z-10' : 'hidden'} md:relative md:block md:w-1/4 bg-orange-50 dark:bg-gray-800 overflow-y-auto`}>
          <div className="p-4">
            {/* Add close button for mobile view */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden absolute top-4 right-4 text-gray-600 dark:text-gray-400"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('chat');
                    setIsMobileMenuOpen(false);
                  }}
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
                <button
                  onClick={() => {
                    setActiveTab('order')
                    setIsMobileMenuOpen(false);
                  }}
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
              <li>
                <h4 className="text-md font-semibold mb-2 text-gray-600 dark:text-gray-400">Providers</h4>
                <ul className="space-y-2">
                  {combinedProviders.map(provider => (
                    <li key={provider}>
                      <button
                        onClick={() => {
                          setSelectedProvider(provider);
                          window.open(providerUrls[provider], '_blank');
                        }}
                        className="flex items-center w-full p-2 rounded-lg transition-colors hover:bg-orange-200 dark:hover:bg-orange-600"
                      >
                        <FontAwesomeIcon icon={getProviderIcon(provider)} className="mr-2 text-orange-600 dark:text-orange-400" />
                        <span className="text-gray-800 dark:text-white">{provider}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <h4 className="text-md font-semibold mb-2 text-gray-600 dark:text-gray-400">Group Members</h4>
                <ul className="space-y-2">
                  {uniqueUsers.map(user => (
                    <li key={user.id} className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${onlineUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-gray-800 dark:text-white">{user.name}</span>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden w-full">
          {activeTab === 'chat' && (
            <Chat
              selectedUsers={selectedUsers}
              onUpdateSelectedUsers={setSelectedUsers}
              onChatIdChange={setChatId}
              chatId={chatId}
              onUnreadMessagesChange={setUnreadMessages}
              onlineUsers={onlineUsers}
              setOnlineUsers={setOnlineUsers}
              onClose={handleCloseChat}
            />
          )}
          {activeTab === 'order' && (
            <OrderProcess
              chatId={chatId}
              users={selectedUsers}
              currentUserId={session?.user?.id}
              onlineUsers={onlineUsers}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPageContent;
