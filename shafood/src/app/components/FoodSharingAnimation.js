import { motion } from 'framer-motion';

const FoodSharingAnimation = () => {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        stroke="#FFA500"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      
      <motion.path
        d="M30 50 L70 50"
        stroke="#4CAF50"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      
      <motion.path
        d="M50 30 L50 70"
        stroke="#4CAF50"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.75, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      
      <motion.circle
        cx="50"
        cy="50"
        r="5"
        fill="#FF4136"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      
      <motion.path
        d="M35 65 Q50 80 65 65"
        stroke="#FF851B"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1.25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </svg>
  );
};

export default FoodSharingAnimation;
