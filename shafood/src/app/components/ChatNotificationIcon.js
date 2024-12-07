'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import Pusher from 'pusher-js';
import { useRouter } from 'next/navigation';  
import { toast } from 'react-toastify';

const ChatNotificationIcon = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChatList, setShowChatList] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { data: session } = useSession();
  const router = useRouter();
  const dropdownRef = useRef(null);
  const pusherRef = useRef(null);
  const lastFetchRef = useRef(Date.now());
  const initialFetchDoneRef = useRef(false);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users/online');
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(new Set(data.onlineUsers));
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  }, []);

  const groupAndSortChats = useCallback((chatList) => {
    // Create a map to group chats by participant combinations
    const groupedChats = new Map();

    chatList.forEach(chat => {
      // Sort participant IDs to create consistent keys
      const participantIds = chat.participants
        .filter(p => p.id !== session?.user?.id)
        .map(p => p.id)
        .sort()
        .join('|');

      // Keep only the most recent chat for each participant combination
      if (!groupedChats.has(participantIds) || 
          new Date(chat.lastMessage?.createdAt || chat.updatedAt) > 
          new Date(groupedChats.get(participantIds).lastMessage?.createdAt || groupedChats.get(participantIds).updatedAt)) {
        groupedChats.set(participantIds, chat);
      }
    });

    // Convert map back to array and sort by most recent activity
    return Array.from(groupedChats.values()).sort((a, b) => {
      const dateA = new Date(a.lastMessage?.createdAt || a.updatedAt);
      const dateB = new Date(b.lastMessage?.createdAt || b.updatedAt);
      return dateB - dateA;
    });
  }, [session?.user?.id]);

  const calculateUnreadCount = useCallback((chats) => {
    return chats.reduce((sum, chat) => {
      const lastMessage = chat.lastMessage;
      if (!lastMessage) return sum;
      
      // Check if message is unread
      const isUnread = lastMessage.sender !== session?.user?.name && 
                      !lastMessage.readBy?.includes(session?.user?.id);
      
      return sum + (isUnread ? 1 : 0);
    }, 0);
  }, [session?.user]);

  const fetchChats = useCallback(async (force = false) => {
    if (!session?.user || loading || (!force && !showChatList)) return;

    const now = Date.now();
    if (!force && now - lastFetchRef.current < 10000) return;
    lastFetchRef.current = now;

    try {
      setLoading(true);
      const response = await fetch('/api/chat/list');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      const groupedData = groupAndSortChats(data);
      
      setChats(prevChats => {
        const hasChanged = JSON.stringify(prevChats) !== JSON.stringify(groupedData);
        return hasChanged ? groupedData : prevChats;
      });
      
      setUnreadCount(calculateUnreadCount(groupedData));
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user, loading, showChatList, groupAndSortChats, calculateUnreadCount]);

  // Initial fetch only once when component mounts
  useEffect(() => {
    if (session?.user && !initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchChats(true);
    }
  }, [session?.user]);

  // Fetch when dropdown is opened
  useEffect(() => {
    if (showChatList && session?.user) {
      fetchChats();
    }
  }, [showChatList]);

  // Pusher real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusher.subscribe(`user-${session.user.id}`);
    
    channel.bind('new-message', (data) => {
      setChats(prevChats => {
        const chatIndex = prevChats.findIndex(chat => chat.id === data.chatId);
        if (chatIndex === -1) return prevChats;

        const updatedChats = [...prevChats];
        const updatedChat = {
          ...updatedChats[chatIndex],
          lastMessage: {
            text: data.text,
            sender: data.sender,
            createdAt: new Date().toISOString(),
            type: data.type || 'text',
            readBy: data.readBy || []
          }
        };

        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(updatedChat);

        // Show notification if not in the same chat
        const currentPath = window.location.pathname;
        const currentChatId = new URLSearchParams(window.location.search).get('chatId');
        
        if (
          (currentPath !== '/chat' || currentChatId !== data.chatId) && 
          data.sender !== session.user.name
        ) {
          // Play notification sound
          const notificationSound = new Audio('/notification.mp3');
          notificationSound.play().catch(err => console.error('Error playing sound:', err));

          // Show toast notification with custom styling
          toast(
            <div className="flex flex-col">
              <div className="font-medium">{data.sender}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {data.text.length > 50 ? data.text.substring(0, 50) + '...' : data.text}
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
              onClick: () => {
                router.push(`/chat?chatId=${data.chatId}`);
              },
              icon: () => (
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  <FontAwesomeIcon icon={faComments} className="text-sm" />
                </div>
              )
            }
          );
        }

        setUnreadCount(calculateUnreadCount(updatedChats));
        return updatedChats;
      });
    });

    pusherRef.current = { pusher, channel };

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id, calculateUnreadCount, router]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowChatList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChatClick = useCallback((chat) => {
    const participants = chat.participants.filter(p => p.id !== session?.user?.id);
    router.push(`/chat?users=${encodeURIComponent(JSON.stringify(participants))}&chatId=${chat.id}`);
    setShowChatList(false);
    setUnreadCount(prev => Math.max(0, prev - (chat.unreadCount || 0)));
  }, [router, session?.user?.id]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return messageDate.toLocaleDateString();
  };

  // Improved mobile-friendly UI
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowChatList(!showChatList)}
        className="relative p-2 text-gray-600 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400 transition-colors"
        aria-label="Chat notifications"
      >
        <FontAwesomeIcon icon={faComments} className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showChatList && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 mx-auto md:absolute md:right-0 md:left-auto md:top-auto md:mt-2 w-full md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50 max-h-[80vh] md:max-h-96"
          >
            <div className="sticky top-0 z-10 p-3 bg-orange-500 dark:bg-orange-600 text-white font-semibold flex justify-between items-center">
              <span>Recent Chats</span>
              <button 
                onClick={() => setShowChatList(false)}
                className="md:hidden p-1 hover:bg-orange-600 rounded"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div 
              className="overflow-y-auto scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-transparent hover:scrollbar-thumb-orange-600"
              style={{ 
                maxHeight: 'calc(80vh - 48px)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#f97316 transparent'
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center p-4">
                  <FontAwesomeIcon icon={faSpinner} className="text-orange-500 animate-spin" />
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No recent chats
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {chats.map(chat => (
                    <motion.div
                      key={chat.id}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                      className="p-3 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700"
                      onClick={() => handleChatClick(chat)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">
                              {chat.participants
                                .filter(p => p.id !== session?.user?.id)
                                .map(p => p.name)
                                .join(', ')}
                            </h3>
                            {chat.participants.some(p => p.id !== session?.user?.id && onlineUsers.has(p.id)) && (
                              <span className="w-2 h-2 bg-green-500 rounded-full" title="Online"/>
                            )}
                          </div>
                          {chat.lastMessage && (
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {chat.lastMessage.sender === session?.user?.name ? 'You' : chat.lastMessage.sender}: {chat.lastMessage.text}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatTimeAgo(chat.lastMessage.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatNotificationIcon; 