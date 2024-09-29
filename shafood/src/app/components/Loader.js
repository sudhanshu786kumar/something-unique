import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ size = 'h-16 w-16' }) => {
  return (
    <div className={`flex justify-center items-center ${size}`}>
      <motion.div
        className="relative"
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div className="absolute inset-0 rounded-full border-t-4 border-orange-600 opacity-25"></div>
        <div className="absolute inset-0 rounded-full border-t-4 border-orange-600 animate-spin"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent">
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-orange-600 rounded-full transform -translate-x-1/2"></div>
        </div>
      </motion.div>
      <motion.div
        className="absolute"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="text-orange-600 font-bold text-xl">ShaFood</div>
      </motion.div>
    </div>
  );
};

export default Loader;
