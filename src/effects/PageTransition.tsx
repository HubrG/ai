"use client";
import { motion } from "framer-motion";
import { FC, ReactNode, useState, useEffect } from "react";

interface MotionPageProps {
  children: ReactNode;
  type?: number;
  duration?: number;
}

const PageTransition: FC<MotionPageProps> = ({ children, type = 0, duration = 0.4 }) => {
 
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const commonProps = {
    exit: { opacity: 0 },
    transition: { duration: duration },
  };

  const blurProps = {
    ...commonProps,
    animate: isMounted ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(1px)' },
    initial: { opacity: isMounted ? 1 : 0, filter: isMounted ? 'blur(0px)' : 'blur(1px)' },
  };

  const opacityProps = {
    ...commonProps,
    animate: { opacity: isMounted ? 1 : 0 },
    initial: { opacity: isMounted ? 1 : 0 },
  };

  return (
    <motion.div {...(type === 0 ? blurProps : opacityProps)}>
      {children}
    </motion.div>
  );
};

export default PageTransition;
