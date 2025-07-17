import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.98 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing curve for smoother motion
        opacity: { duration: 0.6 },
        y: { duration: 0.8 },
        scale: { duration: 0.8 },
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
