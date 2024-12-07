'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faUser, faShoppingBasket, faCheckCircle, faClock, faMoneyBill, faTruck } from '@fortawesome/free-solid-svg-icons';
import Pusher from 'pusher-js';

const OrderStatusBadge = ({ status, totalAmount }) => {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'completed':
        return {
          icon: faCheckCircle,
          text: 'Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
        };
      case 'in-progress':
        return {
          icon: faTruck,
          text: 'In Progress',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
        };
      case 'pending':
        return {
          icon: faClock,
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
        };
      default:
        return {
          icon: faShoppingBasket,
          text: 'New Order',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${config.className}`}>
        <FontAwesomeIcon icon={config.icon} className="text-xs" />
        {config.text}
      </span>
      {totalAmount > 0 && (
        <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <FontAwesomeIcon icon={faMoneyBill} />
          ₹{totalAmount}
        </span>
      )}
    </div>
  );
};

const RecentChats = ({ onChatSelect }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchChats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/chat/list');
      if (response.ok) {
        const data = await response.json();
        // Filter chats where current user is involved
        const filteredChats = data.filter(chat => {
          return (
            // Chat has messages or current user is creator
            (chat.messages?.length > 0 || chat.creatorId === session.user.id) &&
            // Has valid participants
            chat.participants?.length > 0 &&
            // Current user is involved
            (chat.users?.includes(session.user.id) || chat.creatorId === session.user.id)
          );
        });
        setChats(filteredChats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchChats();
    }
  }, [session?.user?.id, fetchChats]);

  // Pusher subscription for real-time updates
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
        
        if (chatIndex === -1) {
          // If chat doesn't exist in the list, fetch all chats
          fetchChats();
          return prevChats;
        }

        const updatedChats = [...prevChats];
        const updatedChat = {
          ...updatedChats[chatIndex],
          lastMessage: {
            text: data.text,
            sender: data.sender,
            createdAt: new Date().toISOString()
          }
        };

        // Move updated chat to top
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(updatedChat);

        return updatedChats;
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id, fetchChats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FontAwesomeIcon icon={faSpinner} size="2x" className="text-orange-500" />
        </motion.div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        <FontAwesomeIcon icon={faUser} className="text-4xl mb-2" />
        <p>No recent chats found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const otherParticipants = chat.participants;
        const chatName = otherParticipants.map(p => p.name).join(', ');
        
        console.log('Chat data:', chat);

        return (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow hover:shadow-md cursor-pointer"
            onClick={() => onChatSelect(chat)}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{chatName}</h3>
                    {chat.orderer && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (Ordered by: {chat.orderer === session?.user?.id ? 'You' : 
                          otherParticipants.find(p => p.id === chat.orderer)?.name || 'Unknown'})
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <div className="flex flex-col mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {chat.lastMessage.sender === session?.user?.name ? 'You' : chat.lastMessage.sender}: {chat.lastMessage.text}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(chat.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Status Section */}
              {chat.orderStatus && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                  <OrderStatusBadge 
                    status={chat.orderStatus} 
                    totalAmount={chat.totalAmount} 
                  />
                  {chat.provider && (
                    <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100 px-2 py-1 rounded-full">
                      {chat.provider}
                    </span>
                  )}
                </div>
              )}

              {/* Deposits Section - Show if any deposits exist */}
              {Object.keys(chat.deposits || {}).length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Deposits: </span>
                  {Object.entries(chat.deposits).map(([userId, amount]) => (
                    <span key={userId} className="ml-1">
                      {otherParticipants.find(p => p.id === userId)?.name || 'You'}: ₹{amount}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RecentChats; 