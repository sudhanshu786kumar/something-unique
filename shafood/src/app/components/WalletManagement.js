// src/app/components/WalletManagement.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const WalletManagement = () => {
    const { data: session } = useSession();
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        const response = await fetch(`/api/wallet/balance?userId=${session.user.id}`);
        const data = await response.json();
        setBalance(data.balance);
    };

    const handleDeposit = async () => {
        const response = await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session.user.id, amount: parseFloat(amount) }),
        });
        if (response.ok) {
            fetchBalance();
            setAmount('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Wallet</h2>
            <p className="text-xl mb-4">Balance: ${balance.toFixed(2)}</p>
            <div className="flex items-center">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border rounded-l px-4 py-2 w-full"
                    placeholder="Enter amount"
                />
                <button
                    onClick={handleDeposit}
                    className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                >
                    Deposit
                </button>
            </div>
        </div>
    );
};

export default WalletManagement;