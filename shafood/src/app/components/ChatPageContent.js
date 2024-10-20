'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faShoppingBasket, faCartPlus, faComments, faBars, faTimes, faBell, faUsers, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import Chat from './Chat';
import OrderProcess from './OrderProcess';
import { useTheme } from 'next-themes';
import Pusher from 'pusher-js';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const mobileMenuRef = useRef(null);

  // Add this after the state declarations
  const uniqueUsers = Array.from(new Set(selectedUsers.map(user => JSON.stringify(user))))
    .map(userString => JSON.parse(userString));

  const onChatIdChange = useCallback((newChatId) => {
    setChatId(newChatId);
  }, []);

  const findOrCreateChatSession = useCallback(async (userIds) => {
    if (!session || !session.user) {
      console.error("Session or user is not available");
      return;
    }

    // Ensure the current user is always included
    const allUserIds = Array.from(new Set([...userIds, session.user.id]));

    if (allUserIds.length < 2) {
      toast.error("Please select at least one other user to start a chat.");
      return;
    }

    try {
      const response = await fetch('/api/chat/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: allUserIds }),
      });

      if (response.ok) {
        const { chatId } = await response.json();
        onChatIdChange(chatId);
        initializePusher(chatId);
      } else {
        throw new Error("Failed to create or update chat session");
      }
    } catch (error) {
      console.error("Error in findOrCreateChatSession:", error);
    }
  }, [session, onChatIdChange]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/dashboard');
    } else if (status === 'authenticated' && session && session.user) {
      // Only proceed with chat initialization if the user is authenticated
      const userIds = selectedUsers.map(user => user.id);
      findOrCreateChatSession(userIds);
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
  }, [status, router, session, selectedUsers, findOrCreateChatSession, chatId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const combinedProviders = [...new Set(selectedUsers.flatMap(user => user.preferredProviders || []).filter(Boolean))];
  console.log(combinedProviders)

  const renderMobileMenu = () => (
    <motion.div
      ref={mobileMenuRef}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-lg"
    >
      <div className="p-4">
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Menu</h3>
        <div className="space-y-4">
          <button
            onClick={() => {
              setActiveTab('chat');
              setShowMobileMenu(false);
            }}
            className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center text-gray-800 dark:text-white"
          >
            <FontAwesomeIcon icon={faComments} className="mr-3 text-orange-500" />
            Chats
          </button>
          <button
            onClick={() => {
              setActiveTab('order');
              setShowMobileMenu(false);
            }}
            className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center text-gray-800 dark:text-white"
          >
            <FontAwesomeIcon icon={faUtensils} className="mr-3 text-orange-500" />
            Process Order
          </button>
          <div>
            <h4 className="text-md font-semibold mb-2 text-gray-600 dark:text-gray-400">Providers</h4>
            {combinedProviders.map(provider => (
              <button
                key={provider}
                onClick={() => {
                  setSelectedProvider(provider);
                  window.open(providerUrls[provider], '_blank');
                }}
                className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center text-gray-800 dark:text-white mb-2"
              >
                <FontAwesomeIcon icon={getProviderIcon(provider)} className="mr-3 text-orange-500" />
                {provider}
              </button>
            ))}
          </div>
          <div>
            <h4 className="text-md font-semibold mb-2 text-gray-600 dark:text-gray-400">Group Members</h4>
            {uniqueUsers.map(user => (
              <div key={user.id} className="flex items-center p-2">
                <span className={`w-3 h-3 rounded-full mr-3 ${onlineUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-gray-800 dark:text-white">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const handleCloseChat = () => {
    // Define what should happen when the chat is closed
    // For example, you might want to reset some state or navigate to a different page
    setActiveTab('dashboard'); // Assuming you have a dashboard tab
    setChatId('');
  };

  const renderSidebar = () => (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black z-20"
        onClick={() => setIsSidebarOpen(false)}
      />
      <motion.div
        ref={sidebarRef}
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-30 w-80 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto"
      >
        <div className="p-6 relative">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
          <h2 className="text-2xl font-bold mb-8 text-orange-600 dark:text-orange-400">Menu</h2>
          <ul className="space-y-6">
            <li>
              <button
                onClick={() => {
                  setActiveTab('chat');
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-orange-200 dark:bg-orange-600'
                    : 'hover:bg-orange-200 dark:hover:bg-orange-600'
                }`}
              >
                <FontAwesomeIcon icon={faComments} className="mr-3 text-orange-600 dark:text-orange-400" />
                <span className="text-lg text-gray-800 dark:text-white">Group Chat</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('order');
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeTab === 'order'
                    ? 'bg-orange-200 dark:bg-orange-600'
                    : 'hover:bg-orange-200 dark:hover:bg-orange-600'
                }`}
              >
                <FontAwesomeIcon icon={faUtensils} className="mr-3 text-orange-600 dark:text-orange-400" />
                <span className="text-lg text-gray-800 dark:text-white">Process Order</span>
              </button>
            </li>
            <li>
              <h4 className="text-lg font-semibold mb-3 text-gray-600 dark:text-gray-400">Providers</h4>
              <ul className="space-y-3">
                {combinedProviders.map(provider => (
                  <li key={provider}>
                    <button
                      onClick={() => {
                        setSelectedProvider(provider);
                        window.open(providerUrls[provider], '_blank');
                      }}
                      className="flex items-center w-full p-3 rounded-lg transition-colors hover:bg-orange-200 dark:hover:bg-orange-600"
                    >
                      <FontAwesomeIcon icon={getProviderIcon(provider)} className="mr-3 text-orange-600 dark:text-orange-400" />
                      <span className="text-gray-800 dark:text-white">{provider}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <h4 className="text-lg font-semibold mb-3 text-gray-600 dark:text-gray-400">Group Members</h4>
              <ul className="space-y-3">
                {uniqueUsers.map(user => (
                  <li key={user.id} className="flex items-center p-2">
                    <span className={`w-3 h-3 rounded-full mr-3 ${onlineUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-gray-800 dark:text-white">{user.name}</span>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </motion.div>
    </>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => isMobile ? setShowMobileMenu(true) : setIsSidebarOpen(true)}
            className="mr-4 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={isMobile ? faChevronUp : faBars} size="lg" />
          </button>
          <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400">ShaFood</h1>
        </div>
        <div className="flex items-center">
          {unreadMessages > 0 && (
            <div className="mr-4 relative">
              <FontAwesomeIcon icon={faBell} className="text-orange-500" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            </div>
          )}
          <button className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <FontAwesomeIcon icon={faUsers} size="lg" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isMobile ? (
            showMobileMenu && renderMobileMenu()
          ) : (
            isSidebarOpen && renderSidebar()
          )}
        </AnimatePresence>
        <main className="h-full overflow-y-auto p-4">
          {status === 'authenticated' ? (
            <>
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
            </>
          ) : status === 'loading' ? (
            <div>Loading...</div>
          ) : (
            <div>Please log in to start a chat.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPageContent;
