'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faUser, faShoppingBasket, faCheckCircle, faClock, faMoneyBill, faTruck, faComments } from '@fortawesome/free-solid-svg-icons';
import Pusher from 'pusher-js';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

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
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await fetch('/api/chat/recent');
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error('Error fetching recent chats:', error);
        toast.error('Failed to load recent chats');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  const handleChatClick = async (chat) => {
    try {
      // Store chat users in localStorage
      const chatUsers = chat.participants.map(participant => ({
        id: participant.id,
        name: participant.name,
        preferences: participant.preferences
      }));
      localStorage.setItem('chatUsers', JSON.stringify(chatUsers));

      // Navigate to chat page with appropriate tab based on order status
      const tab = chat.orderStatus ? 'order' : 'chat';
      router.push(`/chat/${chat.id}?tab=${tab}`);

    } catch (error) {
      console.error('Error navigating to chat:', error);
      toast.error('Failed to open chat');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FontAwesomeIcon icon={faSpinner} className="text-2xl text-orange-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chats.length > 0 ? (
        chats.map((chat) => {
          const otherParticipants = chat.participants.filter(
            p => p.id !== session?.user?.id
          );

          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleChatClick(chat)}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {otherParticipants.length === 1
                      ? otherParticipants[0].name
                      : `${otherParticipants[0].name} & ${otherParticipants.length - 1} others`}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {chat.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {chat.lastMessage?.createdAt && 
                    formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                </span>
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

              {/* Deposits Section */}
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
            </motion.div>
          );
        })
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FontAwesomeIcon icon={faComments} className="text-4xl mb-2 text-orange-500" />
          <p>No recent chats</p>
          <p className="text-sm">Start a new chat to see it here!</p>
        </div>
      )}
    </div>
  );
};

export default RecentChats; 