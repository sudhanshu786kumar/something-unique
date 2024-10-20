'use client'

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faUsers, faWallet, faMapMarkedAlt, faHandshake, faLeaf } from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/Layout'

export default function AboutContent() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-xl shadow-2xl"
          >
            <h1 className="text-3xl font-bold text-orange-600 mb-6">About ShaFood</h1>
            
            <div className="space-y-6 text-gray-700">
              <p>
                ShaFood is a revolutionary food sharing and group ordering platform designed to bring people together through the joy of shared meals. Our mission is to make group dining experiences more accessible, affordable, and enjoyable for everyone.
              </p>

              <h2 className="text-2xl font-semibold text-orange-600 mt-8">Our Features</h2>
              <ul className="list-none space-y-4">
                <li className="flex items-start">
                  <FontAwesomeIcon icon={faUsers} className="text-orange-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold">Group Ordering</h3>
                    <p>Easily create and manage group orders with friends, family, or colleagues.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FontAwesomeIcon icon={faWallet} className="text-orange-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold">Integrated Wallet</h3>
                    <p>Manage your funds and split bills effortlessly with our built-in wallet system.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FontAwesomeIcon icon={faMapMarkedAlt} className="text-orange-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold">Location Sharing</h3>
                    <p>Share your location with group members to facilitate easy meetups and deliveries.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FontAwesomeIcon icon={faUtensils} className="text-orange-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold">Diverse Cuisine Options</h3>
                    <p>Explore a wide range of restaurants and cuisines to satisfy every palate in your group.</p>
                  </div>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-orange-600 mt-8">Our Vision</h2>
              <p>
                At ShaFood, we envision a world where sharing meals brings communities closer together. We strive to eliminate the hassles of group ordering and bill splitting, allowing you to focus on what truly matters - enjoying great food with great company.
              </p>

              <h2 className="text-2xl font-semibold text-orange-600 mt-8">Our Values</h2>
              <ul className="list-none space-y-4">
                <li className="flex items-start">
                  <FontAwesomeIcon icon={faHandshake} className="text-orange-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold">Community</h3>
                    <p>We believe in the power of shared experiences to build stronger connections.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FontAwesomeIcon icon={faLeaf} className="text-orange-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold">Sustainability</h3>
                    <p>By encouraging group orders, we aim to reduce the environmental impact of multiple deliveries.</p>
                  </div>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-orange-600 mt-8">Join Us</h2>
              <p>
                Whether you&apos;re planning a casual lunch with coworkers, a dinner party with friends, or just looking to share the cost of delivery, ShaFood is here to make your group dining experience smooth and enjoyable. Join us today and discover a new way to dine together!
              </p>
            </div>

            <div className="mt-8 text-center">
              <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-semibold">
                Contact Us
              </Link>
              <span className="mx-2 text-gray-400">|</span>
              <Link href="/terms" className="text-orange-600 hover:text-orange-700 font-semibold">
                Terms & Conditions
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
