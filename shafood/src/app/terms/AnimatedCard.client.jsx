"use client";

import { motion } from 'framer-motion';
import React from 'react';

export default function AnimatedCard({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
