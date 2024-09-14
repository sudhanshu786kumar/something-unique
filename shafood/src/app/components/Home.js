'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import FoodSharingAnimation from './FoodSharingAnimation'

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-br from-orange-100 to-red-100">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h1 className="text-5xl font-bold mb-8 text-orange-600">Welcome to ShaFood</h1>
                <p className="text-xl mb-8 text-center max-w-2xl text-gray-700">
                    Find nearby users, order food together, and split the bill with ease!
                </p>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-12 w-64 h-64"
            >
                <FoodSharingAnimation />
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

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
                <FeatureCard 
                    icon="🍽️" 
                    title="Share Meals" 
                    description="Connect with nearby users and share delicious meals together."
                />
                <FeatureCard 
                    icon="💰" 
                    title="Split Bills" 
                    description="Easily split the bill among your group, hassle-free."
                />
                <FeatureCard 
                    icon="🌟" 
                    title="Discover" 
                    description="Explore new cuisines and make friends over great food."
                />
            </motion.div>
        </div>
    )
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-orange-600">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}
