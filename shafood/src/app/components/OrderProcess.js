import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faExclamationCircle, faUser, faUtensils, faTimes, faShoppingCart, faTruck, faHandshake, faUndo, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import Tooltip from './Tooltip';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';

const OrderProcess = ({ chatId, users, currentUserId }) => {
    const [orderStatus, setOrderStatus] = useState('pending');
    const [userStatuses, setUserStatuses] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedOrderer, setSelectedOrderer] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [receivedCount, setReceivedCount] = useState(0);

    // Use useMemo to create a unique list of users
    const uniqueUsers = useMemo(() => {
        const uniqueUserMap = new Map();
        users.forEach(user => {
            if (!uniqueUserMap.has(user.id)) {
                uniqueUserMap.set(user.id, user);
            }
        });
        return Array.from(uniqueUserMap.values());
    }, [users]);

    useEffect(() => {
        fetchOrderStatus();
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe(`chat-${chatId}`);
        channel.bind('order-update', (data) => {
            setOrderStatus(data.orderStatus);
            setUserStatuses(data.userStatuses);
            setSelectedOrderer(data.ordererId);
            updateReceivedCount(data.userStatuses);
        });

        return () => {
            pusher.unsubscribe(`chat-${chatId}`);
        };
    }, [chatId]);

    const fetchOrderStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/order/status?chatId=${chatId}`);
            const data = await response.json();
            setOrderStatus(data.orderStatus || 'pending');
            setUserStatuses(data.userStatuses || {});
            setSelectedOrderer(data.orderer || null);
            updateReceivedCount(data.userStatuses || {});
        } catch (error) {
            console.error('Error fetching order status:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateReceivedCount = (statuses) => {
        const count = Object.values(statuses).filter(status => status === 'received').length;
        setReceivedCount(count);
    };

    const updateStatus = async (status) => {
        if (status === 'ordered' && selectedOrderer !== currentUserId) {
            toast.error('Only the selected orderer can mark the order as placed.');
            return;
        }
        try {
            const response = await fetch('/api/order/updateStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    chatId, 
                    status, 
                    ordererId: status === 'pending' ? null : selectedOrderer,
                    resetUserStatuses: status === 'pending'
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to update order status');
            }
            const data = await response.json();
            if (data.success) {
                toast.success(`Order status updated to ${status}.`);
                // Update local state immediately for better UX
                setOrderStatus(status);
                if (status === 'pending') {
                    setUserStatuses({});
                    setReceivedCount(0);
                }
            } else {
                throw new Error('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status. Please try again.');
        }
    };

    const toggleOrderer = async (userId) => {
        if (orderStatus !== 'pending') {
            toast.error("Orderer can only be changed when the order status is pending.");
            return;
        }
        try {
            const response = await fetch('/api/order/updateOrderer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, ordererId: userId === selectedOrderer ? null : userId }),
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Toggle orderer response:", data);
                // The server will trigger the Pusher event, so we don't need to update the state here
            }
        } catch (error) {
            console.error('Error updating orderer:', error);
            toast.error('Failed to update orderer. Please try again.');
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'ordered': return faSpinner;
            case 'received': return faCheckCircle;
            default: return faExclamationCircle;
        }
    };

    const timelineSteps = [
        { status: 'pending', label: 'Select Orderer', icon: faUser },
        { status: 'ordered', label: 'Order Placed', icon: faShoppingCart },
        { status: 'received', label: 'Order Received', icon: faCheckCircle },
    ];

    const getCurrentStep = () => {
        return timelineSteps.findIndex(step => step.status === orderStatus);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <FontAwesomeIcon icon={faSpinner} size="3x" className="text-orange-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-4 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Order Process</h2>

            <div className="flex flex-col md:flex-row gap-8">
            {/* Timeline */}
                <div className="md:w-1/2">
            <div className="relative mb-12">
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200 dark:bg-gray-700"></div>
                {timelineSteps.map((step, index) => (
                    <motion.div
                        key={step.status}
                        className="flex items-center mb-8 relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                    >
                        <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{step.label}</h3>
                            {orderStatus === step.status && (
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-gray-600 dark:text-gray-400"
                                >
                                    {step.status === 'pending' ? 'Choose who will place the order.' :
                                     step.status === 'ordered' ? 'Waiting for everyone to receive their order.' :
                                     'Order process completed!'}
                                </motion.p>
                            )}
                        </div>
                        <motion.div 
                            className={`absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center ${
                                orderStatus === step.status ? 'bg-orange-500' : 
                                getCurrentStep() > index ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <FontAwesomeIcon icon={step.icon} className="text-white" />
                        </motion.div>
                    </motion.div>
                ))}
                    </div>
            </div>

                {/* User list and Action buttons */}
                <div className="md:w-1/2">
                    <div className="grid grid-cols-1 gap-4 mb-6">
                {uniqueUsers.map(user => (
                    <motion.div
                        key={user.id}
                        className={`p-4 rounded-lg cursor-pointer ${
                            user.id === selectedOrderer 
                                ? 'bg-orange-200 dark:bg-orange-700 border-4 border-orange-500 shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => toggleOrderer(user.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FontAwesomeIcon 
                                    icon={user.id === selectedOrderer ? faUtensils : faUser} 
                                    className={`${user.id === selectedOrderer ? 'text-orange-600' : 'text-orange-500'} mr-3`} 
                                />
                                <span className="text-lg text-gray-800 dark:text-gray-200">
                                    {user.name}
                                    {user.id === currentUserId && " (You)"}
                                    {user.id === selectedOrderer && (
                                        <span className="ml-2 text-sm font-semibold text-orange-600">
                                            (Orderer)
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <motion.div
                                    animate={{ rotate: userStatuses[user.id] === 'ordered' ? 360 : 0 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <FontAwesomeIcon 
                                        icon={getStatusIcon(userStatuses[user.id])} 
                                        className={`text-2xl ${userStatuses[user.id] === 'received' ? 'text-green-500' : 'text-orange-500'}`}
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <ActionButton
                    onClick={() => updateStatus('ordered')}
                    disabled={orderStatus !== 'pending' || selectedOrderer !== currentUserId}
                    icon={faShoppingCart}
                    text="Mark as Ordered"
                    color="blue"
                />
                <ActionButton
                    onClick={() => updateStatus('received')}
                    disabled={orderStatus !== 'ordered' || userStatuses[currentUserId] === 'received'}
                    icon={receivedCount === users.length ? faCheckCircle : faUserCheck}
                    text={`Mark as Received ${orderStatus === 'ordered' && receivedCount < users.length ? `(${receivedCount}/${users.length})` : ''}`}
                    color="orange"
                />
                <ActionButton
                    onClick={() => setShowResetConfirm(true)}
                    disabled={orderStatus !== 'received'}
                    icon={faUndo}
                    text="Reset Order"
                    color="yellow"
                />
            </div>

            {orderStatus === 'ordered' && receivedCount < users.length && (
                <p className="text-center mt-4 text-orange-600 dark:text-orange-400">
                    All users must mark the order as received before it can be completed.
                </p>
            )}
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <ResetConfirmationModal
                        onCancel={() => setShowResetConfirm(false)}
                        onConfirm={() => {
                            updateStatus('pending');
                            setShowResetConfirm(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}


const ActionButton = ({ onClick, disabled, icon, text, color }) => (
    <motion.button 
        onClick={onClick}
        className={`px-6 py-3 rounded-full text-white font-semibold w-full sm:w-auto
            ${disabled ? 'bg-gray-400 cursor-not-allowed' : `bg-${color}-500 hover:bg-${color}-600`}`}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        disabled={disabled}
    >
        <FontAwesomeIcon icon={icon} className="mr-2" />
        {text}
    </motion.button>
);

const ResetConfirmationModal = ({ onCancel, onConfirm }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full"
        >
            <h3 className="text-xl font-bold mb-4">Reset Order?</h3>
            <p className="mb-4">Are you sure you want to reset the order process? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
                >
                    Cancel
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-500 text-white rounded"
                >
                    Reset
                </motion.button>
            </div>
        </motion.div>
    </motion.div>
);


export default OrderProcess;