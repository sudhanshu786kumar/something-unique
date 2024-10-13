import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const FinalConfirmation = ({ chatId }) => {
    const { data: session } = useSession();
    const [confirmations, setConfirmations] = useState({});
    const [isCompleted, setIsCompleted] = useState(false);

    const fetchConfirmations = useCallback(async () => {
        const response = await fetch(`/api/order/confirmations?chatId=${chatId}`);
        const data = await response.json();
        setConfirmations(data.confirmations);
        setIsCompleted(data.isCompleted);
    }, [chatId]);

    useEffect(() => {
        fetchConfirmations();
    }, [fetchConfirmations]);

    const confirmDelivery = async () => {
        const response = await fetch('/api/order/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, userId: session.user.id }),
        });
        if (response.ok) {
            fetchConfirmations();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Order Confirmation</h2>
            {isCompleted ? (
                <p className="text-green-500 font-bold">Order completed and funds distributed!</p>
            ) : (
                <>
                    <p className="mb-4">Confirm when you&apos;ve received your part of the order:</p>
                    <div className="space-y-2">
                        {Object.entries(confirmations).map(([userId, confirmed]) => (
                            <p key={userId}>{userId}: {confirmed ? 'Confirmed' : 'Pending'}</p>
                        ))}
                    </div>
                    <button onClick={confirmDelivery} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Confirm Delivery</button>
                </>
            )}
        </div>
    );
};

export default FinalConfirmation;
