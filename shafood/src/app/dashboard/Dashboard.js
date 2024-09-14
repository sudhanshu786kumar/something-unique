'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Map from '../components/Map';
import OrderForm from '../components/OrderForm';
import UserList from '../components/UserList';
import Link from 'next/link';
import { motion } from 'framer-motion';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nearbyUsers, setNearbyUsers] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100"
    >
      <nav className="bg-orange-500 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1 
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            className="text-2xl font-bold text-white"
          >
            ShaFood Dashboard
          </motion.h1>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-orange-300 hover:bg-orange-500">
                Menu
                <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" aria-hidden="true" />
              </Menu.Button>
            </div>

            <Transition
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block px-4 py-2 text-sm'
                      )}
                    >
                      About
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block px-4 py-2 text-sm'
                      )}
                    >
                      Help
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSignOut}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full text-left px-4 py-2 text-sm'
                      )}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Transition>
          </Menu>
        </div>
      </nav>

      <main className="container mx-auto mt-8 p-4">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 text-orange-600">Welcome, {session.user.name}!</h2>
          <p className="text-gray-600">Ready to share some delicious food with nearby friends?</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="bg-green-500 text-white p-4">
              <h3 className="text-xl font-semibold">Find Nearby Users</h3>
            </div>
            <div className="p-4">
              <Map setNearbyUsers={setNearbyUsers} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="bg-blue-500 text-white p-4">
              <h3 className="text-xl font-semibold">Create an Order</h3>
            </div>
            <div className="p-4">
              <OrderForm />
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="bg-purple-500 text-white p-4">
            <h3 className="text-xl font-semibold">Nearby Users</h3>
          </div>
          <div className="p-4">
            <UserList users={nearbyUsers} />
          </div>
        </motion.div>
      </main>

      <footer className="bg-orange-500 text-white text-center p-4 mt-8">
        <p>&copy; 2023 ShaFood. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}
