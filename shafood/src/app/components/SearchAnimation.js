import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends, faUtensils, faShoppingBasket, faCartPlus } from '@fortawesome/free-solid-svg-icons';

const SearchAnimation = () => {
  const icons = [faUserFriends, faUtensils, faShoppingBasket, faCartPlus];

  return (
    <div className="flex justify-center items-center h-64">
      <div className="relative">
        {icons.map((icon, index) => (
          <motion.div
            key={index}
            className="absolute"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.5,
            }}
            style={{
              top: `${Math.sin((index * 2 * Math.PI) / icons.length) * 40}px`,
              left: `${Math.cos((index * 2 * Math.PI) / icons.length) * 40}px`,
            }}
          >
            <FontAwesomeIcon icon={icon} className="text-3xl text-orange-500" />
          </motion.div>
        ))}
        <motion.div
          className="text-xl font-bold text-orange-600"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Searching...
        </motion.div>
      </div>
    </div>
  );
};

export default SearchAnimation;
