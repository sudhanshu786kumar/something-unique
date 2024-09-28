'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Loader from './Loader' // Import your existing loader component
import { useEffect, useState } from 'react'

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const features = [
        { icon: '🍽️', title: 'Share Meals', description: 'Connect with nearby users and share delicious meals together.' },
        { icon: '💰', title: 'Split Bills', description: 'Easily split the bill among your group, hassle-free.' },
        { icon: '🌟', title: 'Discover', description: 'Explore new cuisines and make friends over great food.' }
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
        }, 3000); // Change slide every 3 seconds
        return () => clearTimeout(timer);
    }, [currentIndex]);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000); // Simulate loading
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader /> {/* Use your existing loader component */}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-br from-orange-100 to-red-100">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h1 className="text-5xl font-bold mb-8 text-orange-600">ShaFood</h1>
                <p className="text-xl mb-8 text-center max-w-2xl text-gray-700">
                    Discover, Share, and Enjoy Meals Together!
                </p>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-12 w-full max-w-4xl flex justify-center"
            >
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }} // Start from the right
                    animate={{ opacity: 1, x: 0 }} // Slide in to the center
                    exit={{ opacity: 0, x: -100 }} // Slide out to the left
                    transition={{ duration: 0.5 }}
                    className="mt-16 grid grid-cols-1 md:grid-cols-1 gap-8"
                >
                    <FeatureCard 
                        icon={features[currentIndex].icon} 
                        title={features[currentIndex].title} 
                        description={features[currentIndex].description}
                    />
                </motion.div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex space-x-4"
            >
                <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105">
                    Login
                </Link>
                <Link href="/register" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105">
                    Register
                </Link>
            </motion.div>
        </div>
    )
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="bg-white bg-opacity-30 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center">
            <div className="text-4xl mb-4 text-center">{icon}</div> {/* Center the icon */}
            <h3 className="text-xl font-semibold mb-2 text-orange-600 text-center">{title}</h3>
            <p className="text-gray-600 text-center">{description}</p>
        </div>
    )
}
