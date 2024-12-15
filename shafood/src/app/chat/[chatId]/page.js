'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Chat from '@/app/components/Chat';
import OrderProcess from '@/app/components/OrderProcess';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faUtensils, faArrowLeft, faUsers,faSpinner } from '@fortawesome/free-solid-svg-icons';
import Layout from '@/app/components/Layout';

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'chat');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChatData = async () => {
      try {
        // Get stored users from localStorage
        const storedUsers = localStorage.getItem('chatUsers');
        if (storedUsers) {
          setSelectedUsers(JSON.parse(storedUsers));
        }

        // Fetch online users
        const response = await fetch('/api/users/online');
        if (response.ok) {
          const data = await response.json();
          setOnlineUsers(new Set(data.onlineUsers));
        }

        // Set active tab from URL parameter
        const tabParam = searchParams.get('tab');
        if (tabParam) {
          setActiveTab(tabParam);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [searchParams]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const getChatTitle = () => {
    if (!selectedUsers || !session) return '';
    
    // Filter out current user and get other participants' names
    const otherParticipants = selectedUsers
      .filter(user => user.id !== session.user.id)
      .map(user => user.name);

    if (otherParticipants.length === 0) return 'Chat';
    if (otherParticipants.length === 1) return otherParticipants[0];
    if (otherParticipants.length === 2) return otherParticipants.join(' & ');
    return `${otherParticipants[0]} & ${otherParticipants.length - 1} others`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin text-orange-500">
          <FontAwesomeIcon icon={faSpinner} size="2x" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="text-gray-600 dark:text-gray-300 hover:text-orange-500"
                >
                  <FontAwesomeIcon icon={faArrowLeft} size="lg" />
                </motion.button>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate max-w-[200px] md:max-w-md">
                  {getChatTitle()}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faUsers} className="text-orange-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedUsers.filter(user => user.id !== session?.user?.id).length} participants
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {Array.from(onlineUsers).filter(id => id !== session?.user?.id).length} online
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center space-x-8 py-3 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'chat' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700'
                }`}
              >
                <FontAwesomeIcon icon={faComments} />
                <span>Chat</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('order')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'order' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700'
                }`}
              >
                <FontAwesomeIcon icon={faUtensils} />
                <span>Order Process</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-hidden"
          >
            {activeTab === 'chat' ? (
              <Chat
                selectedUsers={selectedUsers}
                initialChatId={params.chatId}
                onUpdateSelectedUsers={setSelectedUsers}
                onlineUsers={onlineUsers}
                session={session}
              />
            ) : (
              <OrderProcess
                chatId={params.chatId}
                users={selectedUsers}
                onlineUsers={onlineUsers}
                currentUserId={session?.user?.id}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
} 