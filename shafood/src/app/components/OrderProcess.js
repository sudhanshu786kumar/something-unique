import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faExclamationCircle, faUser, faUtensils, faTimes, faShoppingCart, faTruck, faHandshake, faUndo } from '@fortawesome/free-solid-svg-icons';
import Tooltip from './Tooltip'; // Assume you have a Tooltip component
import Pusher from 'pusher-js';

const OrderProcess = ({ chatId, users, currentUserId }) => {
    const [orderStatus, setOrderStatus] = useState('pending');
    const [userStatuses, setUserStatuses] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedOrderer, setSelectedOrderer] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    useEffect(() => {
        fetchOrderStatus();
        console.log('Pusher configuration:', {
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe(`chat-${chatId}`);
        channel.bind('order-update', (data) => {
            console.log('Received Pusher event:', data);
            setOrderStatus(data.orderStatus);
            setUserStatuses(data.userStatuses);
            setSelectedOrderer(data.ordererId);
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
            console.log("Order status data:", data);
            console.log("orderer current user id:",currentUserId)
            setOrderStatus(data?.orderStatus || 'pending');
            setUserStatuses(data.userStatuses || {});
            setSelectedOrderer(data.orderer || null);
        } catch (error) {
            console.error('Error fetching order status:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status) => {
        if (status === 'ordered' && selectedOrderer !== currentUserId) {
            alert('Only the selected orderer can mark the order as placed.');
            return;
        }
        try {
            const response = await fetch('/api/order/updateStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, status, ordererId: selectedOrderer }),
            });
            if (response.ok) {
                // The server will trigger the Pusher event, so we don't need to update the state here
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const toggleOrderer = async (userId) => {
        try {
            const response = await fetch('/api/order/updateOrderer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, ordererId: userId === selectedOrderer ? null : userId }),
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Toggle orderer response:", data); // Add this line
                // The server will trigger the Pusher event, so we don't need to update the state here
            }
        } catch (error) {
            console.error('Error updating orderer:', error);
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
        { status: 'pending', icon: faShoppingCart, label: 'Select Orderer' },
        { status: 'ordered', icon: faTruck, label: 'Order Placed' },
        { status: 'received', icon: faHandshake, label: 'Order Received' },
    ];

    const getCurrentStep = () => timelineSteps.findIndex(step => step.status === orderStatus);

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
        <div className="h-full overflow-y-auto bg-white dark:bg-gray-800 p-6">
            <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400"
            >
                Order Process
            </motion.h2>
            
            {/* Timeline */}
            <div className="mb-8 relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200 dark:bg-gray-600"></div>
                {timelineSteps.map((step, index) => (
                    <motion.div 
                        key={step.status}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className={`flex items-center mb-8 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                            <h3 className="text-lg font-semibold mb-2">{step.label}</h3>
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
            
            {/* User list */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 mb-6"
            >
                <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Participants</h3>
                {users.map((user, index) => (
                    <motion.div 
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                            user.id === selectedOrderer 
                                ? 'bg-orange-200 dark:bg-orange-700 border-4 border-orange-500 shadow-lg' // Made border thicker and added shadow
                                : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center">
                            <FontAwesomeIcon 
                                icon={user.id === selectedOrderer ? faUtensils : faUser} 
                                className={`${user.id === selectedOrderer ? 'text-orange-600' : 'text-orange-500'} mr-3`} 
                            />
                            <span className="text-lg text-gray-800 dark:text-gray-200">
                                {user.name}
                                {user.id === selectedOrderer && (
                                    <span className="ml-2 text-sm font-semibold text-orange-600">
                                        (Selected Orderer)
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
                            {orderStatus === 'pending' && (
                                <Tooltip content={user.id === selectedOrderer ? "Remove as orderer" : "Set as orderer"}>
                                    <motion.button
                                        onClick={() => toggleOrderer(user.id)}
                                        className={`p-2 rounded-full ${
                                            user.id === selectedOrderer
                                                ? 'bg-red-500 hover:bg-red-600'
                                                : 'bg-green-500 hover:bg-green-600'
                                        } text-white`}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <FontAwesomeIcon icon={user.id === selectedOrderer ? faTimes : faUtensils} />
                                    </motion.button>
                                </Tooltip>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
            
            {/* Action buttons */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center space-x-4"
            >
                <motion.button 
                    onClick={() => updateStatus('ordered')}
                    className={`px-6 py-3 rounded-full text-white font-semibold ${
                        orderStatus === 'pending' && selectedOrderer === currentUserId
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={orderStatus === 'pending' && selectedOrderer === currentUserId ? { scale: 1.05 } : {}}
                    whileTap={orderStatus === 'pending' && selectedOrderer === currentUserId ? { scale: 0.95 } : {}}
                    disabled={orderStatus !== 'pending' || selectedOrderer !== currentUserId}
                >
                    Mark as Ordered
                </motion.button>
                <motion.button 
                    onClick={() => updateStatus('received')}
                    className={`px-6 py-3 rounded-full text-white font-semibold ${
                        orderStatus === 'ordered'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={orderStatus === 'ordered' ? { scale: 1.05 } : {}}
                    whileTap={orderStatus === 'ordered' ? { scale: 0.95 } : {}}
                    disabled={orderStatus !== 'ordered'}
                >
                    Mark as Received
                </motion.button>
                <motion.button 
                    onClick={() => setShowResetConfirm(true)}
                    className={`px-6 py-3 rounded-full text-white font-semibold ${
                        orderStatus !== 'pending'
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={orderStatus !== 'pending' ? { scale: 1.05 } : {}}
                    whileTap={orderStatus !== 'pending' ? { scale: 0.95 } : {}}
                    disabled={orderStatus === 'pending'}
                >
                    <FontAwesomeIcon icon={faUndo} className="mr-2" />
                    Reset Order
                </motion.button>
            </motion.div>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
                        >
                            <h3 className="text-xl font-bold mb-4">Reset Order?</h3>
                            <p className="mb-4">Are you sure you want to reset the order process? This action cannot be undone.</p>
                            <div className="flex justify-end space-x-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowResetConfirm(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        updateStatus('pending');
                                        setShowResetConfirm(false);
                                    }}
                                    className="px-4 py-2 bg-red-500 text-white rounded"
                                >
                                    Reset
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default OrderProcess;