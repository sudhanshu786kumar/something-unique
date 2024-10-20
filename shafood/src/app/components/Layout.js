'use client';







import React, { useState, useEffect } from 'react';



import { useSession, signOut } from 'next-auth/react';



import { useRouter } from 'next/navigation';



import Link from 'next/link';



import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';



import { faUser, faSignOutAlt, faInfoCircle, faQuestionCircle, faWallet, faBars, faTimes, faUtensils, faUsers, faMapMarkerAlt, faEnvelope, faFileAlt } from '@fortawesome/free-solid-svg-icons';



import DarkModeToggle from './DarkModeToggle';



import { motion, AnimatePresence } from 'framer-motion';







const Layout = ({ children, walletBalance = 0 }) => {



  const { data: session } = useSession();



  const router = useRouter();



  const [isMenuOpen, setIsMenuOpen] = useState(false);







  useEffect(() => {



    if (session) {



      setUserOnline();



    }



    return () => {



      if (session) {



        setUserOffline();



      }



    };



  }, [session]);







  const setUserOnline = async () => {



    try {



      await fetch('/api/user/setOnline', { method: 'POST' });



    } catch (error) {



      console.error('Error setting user online:', error);



    }



  };







  const setUserOffline = async () => {



    try {



      await fetch('/api/user/setOffline', { method: 'POST' });



    } catch (error) {



      console.error('Error setting user offline:', error);



    }



  };







  const handleLogout = async () => {



    try {



      await setUserOffline();



      await signOut({ redirect: false });



      router.push('/login');



    } catch (error) {



      console.error('Error during logout:', error);



    }



  };







  const navItems = [



    { href: '/', label: 'Home', icon: faUtensils },



    { href: '/about', label: 'About', icon: faUsers },



    { href: '/contact', label: 'Contact', icon: faEnvelope },



    { href: '/terms', label: 'Terms', icon: faFileAlt },



  ];







  return (



    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">



      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">



        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">



          <Link href="/" className="flex items-center space-x-2">



            <FontAwesomeIcon icon={faUtensils} className="text-3xl text-orange-500 dark:text-orange-400" />



            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">ShaFood</span>



          </Link>



          



          {/* Desktop Navigation */}



          <nav className="hidden md:flex items-center space-x-6">



            {navItems.map((item) => (



              <Link 



                key={item.href} 



                href={item.href} 



                className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 flex items-center space-x-1"



              >



                <FontAwesomeIcon icon={item.icon} className="text-sm" />



                <span>{item.label}</span>



              </Link>



            ))}



            {session && (



              <>



                <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 flex items-center space-x-1">



                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm" />



                  <span>Dashboard</span>



                </Link>



                <button 



                  onClick={handleLogout} 



                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full transition-colors duration-200"



                >



                  Logout



                </button>



              </>



            )}



          </nav>







          {session && (



            <div className="hidden md:flex items-center space-x-4">



              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-orange-200 dark:bg-gray-700 px-3 py-1 rounded-full">



                <FontAwesomeIcon icon={faWallet} className="mr-2" />



                ₹{walletBalance.toFixed(2)}



              </div>



              <div className="text-gray-700 dark:text-gray-300 flex items-center space-x-2">



                <FontAwesomeIcon icon={faUser} className="text-orange-500" />



                <span>{session.user.name}</span>



              </div>



            </div>



          )}







          <div className="flex items-center space-x-4">



            <DarkModeToggle />



            {/* Mobile Menu Button */}



            <button 



              className="md:hidden text-gray-700 dark:text-gray-300"



              onClick={() => setIsMenuOpen(!isMenuOpen)}



            >



              <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} size="lg" />



            </button>



          </div>



        </div>







        {/* Mobile Navigation */}



        <AnimatePresence>



          {isMenuOpen && (



            <motion.nav 

              initial={{ opacity: 0, y: -20 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -20 }}

              transition={{ duration: 0.2 }}

              className="md:hidden bg-white dark:bg-gray-800 p-4 shadow-lg absolute top-full left-0 right-0 z-50"

            >

              {navItems.map((item) => (

                <Link 

                  key={item.href} 

                  href={item.href} 

                  className="block py-2 text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"

                  onClick={() => setIsMenuOpen(false)}

                >

                  <FontAwesomeIcon icon={item.icon} className="mr-2" />

                  {item.label}

                </Link>

              ))}

              {session && (

                <>

                  <Link 

                    href="/dashboard" 

                    className="block py-2 text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"

                    onClick={() => setIsMenuOpen(false)}

                  >

                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />

                    Dashboard

                  </Link>

                  <button 

                    onClick={handleLogout} 

                    className="block w-full text-left py-2 text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"

                  >

                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />

                    Logout

                  </button>

                  <div className="py-2 text-gray-700 dark:text-gray-300">

                    <FontAwesomeIcon icon={faWallet} className="mr-2" />

                    ₹{walletBalance.toFixed(2)}

                  </div>

                  <div className="py-2 text-gray-700 dark:text-gray-300">

                    <FontAwesomeIcon icon={faUser} className="mr-2" />

                    {session.user.name}

                  </div>

                </>

              )}

            </motion.nav>

          )}



        </AnimatePresence>



      </header>



      <main className="flex-grow w-full">



        {children}



      </main>



    </div>



  );



};







export default Layout;








