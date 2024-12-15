import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faExclamationCircle, faUser, faUtensils, faTimes, faShoppingCart, faTruck, faHandshake, faUndo, faUserCheck, faCircle } from '@fortawesome/free-solid-svg-icons';
import Tooltip from './Tooltip';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';

const OrderProcess = ({ chatId, users, currentUserId, onlineUsers }) => {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [userStatuses, setUserStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrderer, setSelectedOrderer] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [receivedCount, setReceivedCount] = useState(0);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modified uniqueUsers logic to ensure current user is always included
  const uniqueUsers = useMemo(() => {
    try {
      const uniqueUserMap = new Map();
      
      // Get current user from users array
      const currentUser = users.find(user => user.id === currentUserId);
      if (!currentUser) {
        console.error('Current user not found in users list');
        return users; // Return all users if current user not found
      }

      // Add current user first
      uniqueUserMap.set(currentUserId, {
        ...currentUser,
        isCurrentUser: true
      });

      // Add other users
      users.forEach(user => {
        if (!uniqueUserMap.has(user.id)) {
          uniqueUserMap.set(user.id, {
            ...user,
            isCurrentUser: user.id === currentUserId
          });
        }
      });

      return Array.from(uniqueUserMap.values());
    } catch (error) {
      console.error('Error processing users:', error);
      return users;
    }
  }, [users, currentUserId]);

  const handleError = (error, customMessage) => {
    console.error(error);
    setError(customMessage || 'An error occurred. Please try again.');
    toast.error(customMessage || 'An error occurred. Please try again.');
    setIsUpdating(false);
  };

  const toggleOrderer = async (userId) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setError(null);

      if (orderStatus !== 'pending') {
        toast.error("Orderer can only be changed when the order status is pending.");
        return;
      }

      const response = await fetch('/api/order/updateOrderer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId,
          ordererId: userId === selectedOrderer ? null : userId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update orderer');
      }

      const data = await response.json();
      setSelectedOrderer(data.ordererId);
      
      // Show success message
      if (data.ordererId) {
        toast.success(data.ordererId === currentUserId ? 
          "You're now the orderer!" : 
          "Orderer has been updated");
      }

    } catch (error) {
      handleError(error, 'Failed to update orderer. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOrderAction = async (action) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch('/api/order/updateStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId,
          status: action,
          ordererId: selectedOrderer,
          resetUserStatuses: action === 'reset'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const data = await response.json();
      setOrderStatus(data.orderStatus);
      setUserStatuses(data.userStatuses || {});
      
      if (action === 'reset') {
        setSelectedOrderer(null);
        setUserStatuses({});
        toast.success('Order process has been reset');
      } else {
        toast.success(`Order marked as ${action}`);
      }

    } catch (error) {
      handleError(error, `Failed to mark order as ${action}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkReceived = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/chat/${chatId}/mark-received`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to mark as received');
      }

      toast.success('Order marked as received');
    } catch (error) {
      handleError(error, 'Failed to mark order as received');
    } finally {
      setIsUpdating(false);
    }
  };

  // Initialize Pusher and handle real-time updates
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusher.subscribe(`order-${chatId}`);

    channel.bind('order-update', (data) => {
      setOrderStatus(data.orderStatus);
      setUserStatuses(data.userStatuses || {});
      setSelectedOrderer(data.orderer);
    });

    // Fetch initial order state
    const fetchOrderState = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/order/status?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderStatus(data.orderStatus);
          setUserStatuses(data.userStatuses);
          setSelectedOrderer(data.orderer);
        }
      } catch (error) {
        handleError(error, 'Failed to load order state');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderState();

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`order-${chatId}`);
    };
  }, [chatId]);

  // Add action buttons based on order status and user role
  const renderActionButtons = () => {
    if (isUpdating) return null;

    const isOrderer = selectedOrderer === currentUserId;

    return (
      <div className="action-buttons-container">
        {orderStatus === 'pending' && !selectedOrderer && (
          <div className="text-center mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Select someone to be the orderer
            </p>
          </div>
        )}

        {orderStatus === 'pending' && isOrderer && (
          <button
            onClick={() => handleOrderAction('ordered')}
            className="btn-primary w-full mb-2"
          >
            <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
            Start Order Process
          </button>
        )}

        {orderStatus === 'ordered' && isOrderer && (
          <button
            onClick={() => handleOrderAction('delivered')}
            className="btn-primary w-full mb-2"
          >
            <FontAwesomeIcon icon={faTruck} className="mr-2" />
            Mark as Delivered
          </button>
        )}

        {orderStatus === 'delivered' && !userStatuses[currentUserId]?.received && (
          <button
            onClick={() => handleMarkReceived()}
            className="btn-primary w-full mb-2"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Confirm Receipt
          </button>
        )}

        {(orderStatus === 'completed' || isOrderer) && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary w-full"
          >
            <FontAwesomeIcon icon={faUndo} className="mr-2" />
            Reset Order Process
          </button>
        )}
      </div>
    );
  };

  // Update the UI structure
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Status Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <StatusIcon status={orderStatus} />
              <span className="ml-2">
                {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
              </span>
            </h2>
            {selectedOrderer && (
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Orderer: {uniqueUsers.find(u => u.id === selectedOrderer)?.name || 'Unknown'}
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="order-progress-steps">
            <div className="flex justify-between mb-2">
              {['pending', 'ordered', 'delivered', 'completed'].map((step, index) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center
                    ${orderStatus === step ? 'bg-orange-500 text-white' :
                      orderStatus === 'completed' || 
                      ['pending', 'ordered', 'delivered'].indexOf(orderStatus) > 
                      ['pending', 'ordered', 'delivered'].indexOf(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'}`}>
                    <FontAwesomeIcon icon={getStatusIcon(step)} />
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {renderActionButtons()}
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {uniqueUsers.map(user => (
            <UserCard 
              key={user.id}
              user={user}
              isOrderer={user.id === selectedOrderer}
              isCurrentUser={user.id === currentUserId}
              userStatus={userStatuses[user.id]?.status || 'waiting'}
              orderStatus={orderStatus}
              onToggleOrderer={() => toggleOrderer(user.id)}
              isOnline={onlineUsers.has(user.id)}
              canBeOrderer={orderStatus === 'pending' || orderStatus === 'completed'}
            />
          ))}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-semibold mb-4">Reset Order Process?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will reset the entire order process. All progress will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleOrderAction('reset');
                  setShowResetConfirm(false);
                }}
                className="btn-danger"
              >
                Reset
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Separate UserCard component for better organization
const UserCard = ({ user, isOrderer, isCurrentUser, userStatus, orderStatus, onToggleOrderer, isOnline, canBeOrderer }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm
        ${isOrderer ? 'ring-2 ring-orange-500' : ''}
        ${isCurrentUser ? 'border-l-4 border-blue-500' : ''}
        ${orderStatus === 'pending' ? 'cursor-pointer' : 'cursor-default'}
      `}
      onClick={() => orderStatus === 'pending' && onToggleOrderer()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-gray-500" />
            </div>
          )}
          <div>
            <div className="flex items-center">
              <span className="font-medium">{user.name}</span>
              {isOnline && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isOrderer ? 'Orderer' : userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
            </span>
          </div>
        </div>
        <StatusIcon status={userStatus} />
      </div>
    </motion.div>
  );
};

// Separate StatusIcon component for status visualization
const StatusIcon = ({ status }) => {
  const icon = getStatusIcon(status);
  const color = status === 'received' ? 'text-green-500' :
                status === 'ordered' ? 'text-orange-500' :
                'text-gray-400';
  
  return (
    <motion.div
      animate={{ rotate: status === 'ordered' ? 360 : 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <FontAwesomeIcon 
        icon={icon} 
        className={`text-2xl ${color}`}
      />
    </motion.div>
  );
};

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'ordered': return faShoppingCart;
    case 'received': return faCheckCircle;
    case 'delivered': return faTruck;
    case 'completed': return faHandshake;
    default: return faUser;
  }
};

export default OrderProcess;






