import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StepCard = ({ step, title, description, icon, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
    >
      <div className="flex items-center mb-4">
        <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
          {step}
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
      <FontAwesomeIcon icon={icon} className="text-3xl text-orange-500" />
    </motion.div>
  );
};

export default StepCard;
