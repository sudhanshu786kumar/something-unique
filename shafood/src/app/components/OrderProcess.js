import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faExclamationCircle, faUser, faUtensils, faTimes, faShoppingCart, faTruck, faHandshake, faUndo, faUserCheck, faCircle, faMoneyBill, faCrown, faUsers, faArrowRight, faHistory, faBan, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Tooltip from './Tooltip';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';
import { generateAvatar, getDefaultAvatar } from '@/app/utils/avatarUtils';
import Avatar from '@/app/components/Avatar';

const StatusUpdateModal = ({ onClose, onUpdate, currentStatus, isUpdating }) => {
  const statusOptions = [
    { value: 'ordered', label: 'Ordered', icon: faShoppingCart, color: 'orange' },
    { value: 'paid', label: 'Paid', icon: faMoneyBill, color: 'green' },
    { value: 'received', label: 'Received', icon: faCheckCircle, color: 'blue' }
  ];

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Update Order Status</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-3">
          {statusOptions.map(({ value, label, icon, color }) => {
            const isDisabled = 
              (value === 'paid' && currentStatus !== 'ordered') ||
              (value === 'received' && currentStatus !== 'paid');

            return (
              <button
                key={value}
                onClick={() => onUpdate(value)}
                disabled={isDisabled || isUpdating}
                className={`
                  w-full p-4 rounded-lg flex items-center gap-3 transition-colors
                  ${isDisabled 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : `bg-${color}-50 hover:bg-${color}-100 dark:bg-${color}-900/20 dark:hover:bg-${color}-900/30`}
                `}
              >
                <div className={`w-8 h-8 rounded-full bg-${color}-100 dark:bg-${color}-900/30 
                  flex items-center justify-center`}>
                  <FontAwesomeIcon icon={icon} className={`text-${color}-500`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{label}</p>
                  {isDisabled && (
                    <p className="text-sm text-gray-500">
                      Complete previous steps first
                    </p>
                  )}
                </div>
                {currentStatus === value && (
                  <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isUpdating && (
          <div className="mt-4 text-center text-gray-500">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
            Updating status...
          </div>
        )}
      </div>
    </Modal>
  );
};

const CompletionModal = ({ onClose }) => (
  <Modal onClose={onClose}>
    <div className="p-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
        <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-green-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Order Completed!</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        All users have received their orders.
      </p>
      <button
        onClick={onClose}
        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
      >
        Close
      </button>
    </div>
  </Modal>
);

const ResetConfirmModal = ({ onClose, onConfirm }) => (
  <Modal onClose={onClose}>
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">Reset Order Process?</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This will reset all progress and allow starting a new order. This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          Reset Order
        </button>
      </div>
    </div>
  </Modal>
);

const OrderHistoryCard = ({ order, onCancel }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-3"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{order.date}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Orderer: {order.ordererName}
        </p>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm ${
        order.status === 'completed' 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : order.status === 'cancelled'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      }`}>
        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
      </span>
    </div>
    <div className="space-y-2">
      {order.participants.map((participant, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">{participant.name}</span>
          <span className={`px-2 py-0.5 rounded ${
            participant.status === 'received' 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : participant.status === 'paid'
              ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
          }`}>
            {participant.status}
          </span>
        </div>
      ))}
    </div>
    {order.status !== 'cancelled' && order.status !== 'completed' && (
      <button
        onClick={() => onCancel(order.id)}
        className="mt-3 w-full py-2 px-4 bg-red-50 hover:bg-red-100 
          text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2
          dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400"
      >
        <FontAwesomeIcon icon={faBan} />
        Cancel Order
      </button>
    )}
  </motion.div>
);

const OrderProcess = ({ chatId, users, currentUserId, onlineUsers }) => {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [userStatuses, setUserStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrderer, setSelectedOrderer] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [receivedCount, setReceivedCount] = useState(0);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [processStats, setProcessStats] = useState({
    ordered: 0,
    paid: 0,
    received: 0
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  // Define fetchOrderState function
  const fetchOrderState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/order/status?chatId=${chatId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order state');
      }

      const data = await response.json();
      setOrderStatus(data.orderStatus);
      setUserStatuses(data.userStatuses || {});
      setSelectedOrderer(data.orderer);

      // Update process stats
      const stats = {
        ordered: 0,
        paid: 0,
        received: 0
      };
      
      Object.values(data.userStatuses || {}).forEach(status => {
        if (status === 'ordered') stats.ordered++;
        if (status === 'paid') stats.paid++;
        if (status === 'received') stats.received++;
      });
      
      setProcessStats(stats);
    } catch (error) {
      console.error('Error fetching order state:', error);
      handleError(error, 'Failed to load order state');
    } finally {
      setLoading(false);
    }
  };

  // Enhance the Pusher subscription and event handling
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusher.subscribe(`order-${chatId}`);

    channel.bind('order-update', (data) => {
      console.log('Received real-time update:', data);
      
      // Immediately update local state with new data
      setOrderStatus(data.orderStatus);
      setUserStatuses(data.userStatuses || {});
      setSelectedOrderer(data.orderer);

      // Update process stats
      const stats = {
        ordered: 0,
        paid: 0,
        received: 0
      };
      
      Object.values(data.userStatuses || {}).forEach(status => {
        if (status === 'ordered') stats.ordered++;
        if (status === 'paid') stats.paid++;
        if (status === 'received') stats.received++;
      });
      
      setProcessStats(stats);

      // Show toast notification for updates from other users
      if (data.updatedBy !== currentUserId) {
        toast.info(`Order status updated to ${data.orderStatus}`);
      }
    });

    // Error handling for Pusher
    channel.bind('pusher:subscription_error', (error) => {
      console.error('Pusher subscription error:', error);
      toast.error('Failed to connect to real-time updates');
    });

    // Fetch initial state
    fetchOrderState();

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`order-${chatId}`);
    };
  }, [chatId, currentUserId]);

  // Add status tracking
  useEffect(() => {
    if (userStatuses) {
      const stats = {
        ordered: 0,
        paid: 0,
        received: 0
      };
      
      Object.values(userStatuses).forEach(status => {
        if (status === 'ordered') stats.ordered++;
        if (status === 'paid') stats.paid++;
        if (status === 'received') stats.received++;
      });
      
      setProcessStats(stats);

      // Check if all users have marked as received
      if (stats.received === users.length) {
        setShowCompletionModal(true);
      }
    }
  }, [userStatuses, users.length]);

  // Update the handleStatusChange function
  const handleStatusChange = async (newStatus) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      const response = await fetch('/api/order/updateStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          status: newStatus,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      setShowStatusModal(false);
      // Local toast only for the user who made the change
      toast.success(`Your status updated to ${newStatus}`);
    } catch (error) {
      handleError(error, 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

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

  // Add this new function to fetch order history
  const fetchOrderHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/order/history?chatId=${chatId}`);
      if (!response.ok) throw new Error('Failed to fetch order history');
      const data = await response.json();
      setOrderHistory(data.orders);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoadingHistory(false);
    }
  }, [chatId]);

  // Add to useEffect
  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  // Add cancel order function
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch('/api/order/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) throw new Error('Failed to cancel order');
      
      await fetchOrderHistory(); // Refresh history after cancellation
      toast.success('Order cancelled successfully');
      setOrderStatus('pending');
      setUserStatuses({});
      setSelectedOrderer(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setIsUpdating(false);
    }
  };

  // Define handleReset function
  const handleReset = async () => {
    try {
      // Reset the order state in the database
      const response = await fetch(`/api/orders/${chatId}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset order');
      }

      // Reset local state
      setOrderStatus('pending');
      setUserStatuses({});
      setSelectedOrderer(null);
      toast.success('Order process has been reset');
    } catch (error) {
      console.error('Error resetting order:', error);
      toast.error('Failed to reset order process');
    }
  };

  // Update the UI structure
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header with Progress */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-md z-20 p-4">
        <div className="max-w-3xl mx-auto">
          {/* Order Status Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <StatusIcon status={orderStatus} />
              <span>{orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</span>
            </h2>
            {selectedOrderer && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                  rounded-lg transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUndo} className="text-xs" />
                Reset Order
              </button>
            )}
          </div>

          {/* Progress Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatusCard
              label="Ordered"
              count={processStats.ordered}
              total={users.length}
              icon={faShoppingCart}
              color="orange"
            />
            <StatusCard
              label="Paid"
              count={processStats.paid}
              total={users.length}
              icon={faMoneyBill}
              color="green"
            />
            <StatusCard
              label="Received"
              count={processStats.received}
              total={users.length}
              icon={faCheckCircle}
              color="blue"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Order Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="text-md font-medium mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faUtensils} className="text-orange-500" />
            Current Order
          </h3>

          {orderStatus === 'pending' && !selectedOrderer ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
              <p className="text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                Select someone to manage this order
              </p>
            </div>
          ) : null}

          {/* Users List */}
          <div className="space-y-3">
            {uniqueUsers && uniqueUsers.length > 0 ? (
              uniqueUsers.map(user => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.01 }}
                  className={`
                    relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm
                    ${user.id === selectedOrderer ? 'ring-2 ring-orange-500' : ''}
                    ${user.id === currentUserId ? 'border-l-4 border-blue-500' : ''}
                    ${orderStatus === 'pending' && !selectedOrderer ? 'cursor-pointer hover:shadow-md' : ''}
                    transition-all duration-200
                  `}
                  onClick={() => orderStatus === 'pending' && !selectedOrderer && toggleOrderer(user.id)}
                >
                  <div className="flex items-center justify-between">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <Avatar 
                        user={user}
                        size="md"
                        showOnline={true}
                        onlineStatus={onlineUsers.has(user.id)}
                      />

                      {/* User Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {user.name}
                          </span>
                          {user.id === currentUserId && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                          {user.id === selectedOrderer && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                              Orderer
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {userStatuses[user.id] ? (
                            <span className="flex items-center gap-2">
                              <StatusIcon status={userStatuses[user.id]} />
                              {userStatuses[user.id].charAt(0).toUpperCase() + userStatuses[user.id].slice(1)}
                            </span>
                          ) : (
                            'Waiting'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {orderStatus === 'pending' && !selectedOrderer && user.id !== currentUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderer(user.id);
                          }}
                          className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 
                            dark:bg-orange-900/30 dark:hover:bg-orange-900/50 
                            text-orange-600 dark:text-orange-400 rounded-full transition-colors"
                        >
                          Select as Orderer
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faUsers} className="text-3xl mb-2" />
                <p>No users found</p>
              </div>
            )}
          </div>

          {/* Cancel Order Button */}
          {orderStatus !== 'pending' && (
            <button
              onClick={handleCancelOrder}
              className="mt-4 w-full py-2 px-4 bg-red-50 hover:bg-red-100 
                text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2
                dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400"
            >
              <FontAwesomeIcon icon={faBan} />
              Cancel Order
            </button>
          )}
        </div>

        {/* Order History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="text-md font-medium mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faHistory} className="text-blue-500" />
            Order History
          </h3>

          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : orderHistory.length > 0 ? (
            <div className="space-y-3">
              {orderHistory.map((order) => (
                <OrderHistoryCard
                  key={order.id}
                  order={order}
                  onCancel={handleCancelOrder}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FontAwesomeIcon 
                icon={faHistory} 
                className="text-gray-400 dark:text-gray-500 text-3xl mb-2" 
              />
              <p className="text-gray-500 dark:text-gray-400">No order history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setShowStatusModal(true)}
            disabled={isUpdating}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 
              text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faArrowRight} />
            )}
            Update My Status
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showStatusModal && (
          <StatusUpdateModal
            onClose={() => setShowStatusModal(false)}
            onUpdate={handleStatusChange}
            currentStatus={userStatuses[currentUserId] || 'pending'}
            isUpdating={isUpdating}
          />
        )}
        {showResetConfirm && (
          <ResetConfirmModal
            onClose={() => setShowResetConfirm(false)}
            onConfirm={handleReset}
          />
        )}
        {showCompletionModal && (
          <CompletionModal onClose={() => setShowCompletionModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// Update the UserCard component for better UX
const UserCard = ({ user, isOrderer, isCurrentUser, userStatus, orderStatus, onToggleOrderer, isOnline, canBeOrderer }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-3
        ${isOrderer ? 'ring-2 ring-orange-500' : ''}
        ${isCurrentUser ? 'border-l-4 border-blue-500' : ''}
        ${canBeOrderer ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
        transition-all duration-200
      `}
      onClick={() => canBeOrderer && onToggleOrderer()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div className="relative">
            <img 
              src={user.image || getDefaultAvatar(user.email)}
              alt={user.name} 
              className="w-10 h-10 rounded-full object-cover bg-orange-50 dark:bg-gray-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getDefaultAvatar(user.email);
              }}
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
            )}
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 dark:text-white">
                {user.name}
              </span>
              {isCurrentUser && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">You</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isOrderer ? (
                <span className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                  Orderer
                </span>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {canBeOrderer && !isOrderer && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleOrderer();
              }}
              className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 
                dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full transition-colors"
            >
              Select as Orderer
            </button>
          )}
          <StatusIcon status={userStatus} />
        </div>
      </div>

      {/* Progress Indicators */}
      {(userStatus === 'ordered' || userStatus === 'paid' || userStatus === 'received') && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon 
                icon={faShoppingCart} 
                className={userStatus === 'ordered' ? 'text-orange-500' : 'text-gray-400'} 
              />
              <FontAwesomeIcon 
                icon={faMoneyBill} 
                className={userStatus === 'paid' ? 'text-green-500' : 'text-gray-400'} 
              />
              <FontAwesomeIcon 
                icon={faCheckCircle} 
                className={userStatus === 'received' ? 'text-blue-500' : 'text-gray-400'} 
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Add a separate Reset Order component
const ResetOrderButton = ({ onReset, isOrderer }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOrderer) return null;

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 
          hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 
          dark:text-red-400 rounded-lg transition-colors"
      >
        <FontAwesomeIcon icon={faUndo} />
        Reset Order Process
      </button>

      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)}>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Reset Order Process?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will reset all progress and allow starting a new order. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReset();
                  setShowConfirm(false);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Reset Order
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
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

// Helper Components
const StatusCard = ({ label, count, total, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-${color}-50 dark:bg-${color}-900/20 p-3 rounded-lg`}
  >
    <div className="flex items-center justify-between">
      <FontAwesomeIcon icon={icon} className={`text-${color}-500 text-xl`} />
      <span className={`text-${color}-600 font-semibold`}>
        {count}/{total}
      </span>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</p>
  </motion.div>
);

const StatusButton = ({ label, onClick, icon, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
      disabled
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
    }`}
  >
    <FontAwesomeIcon icon={icon} />
    <span>{label}</span>
  </button>
);

const Modal = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

export default OrderProcess;






