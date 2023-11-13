"use client";
import { useEffect, useState, ReactNode } from "react";
import { useAnimation } from "framer-motion";
import dynamic from "next/dynamic";
import { motion, useTransform, useViewportScroll } from "framer-motion";

const MotionWrapperDynamic = dynamic(
  () => import("./MotionWrapper").then((mod) => mod.default),
  {
    ssr: true,
    loading: () => <p>Chargement...</p>,
  }
);

interface MotionScrollProps {
  children: React.ReactNode;
  initialScale?: number;
  finalScale?: number;
  ratio?: number;
}

interface ExtendedNavigator extends Navigator {
  connection?: {
    effectiveType?: string;
    rtt: number;
  };
  mozConnection?: {
    effectiveType?: string;
    rtt: number;
  };
  webkitConnection?: {
    effectiveType?: string;
    rtt: number;
  };
}

const MotionScroll: React.FC<MotionScrollProps> = ({
  children,
  initialScale = 0.2,
  finalScale = 2,
  ratio = 0.33,
}) => {
  const { scrollYProgress } = useViewportScroll();
  const scale = useTransform(
    scrollYProgress,
    [0, ratio, 1],
    [initialScale, 1, finalScale]
  );

  const controls = useAnimation();

  const [isMounted, setIsMounted] = useState(false);
  const [active, setActive] = useState(true);  // Par défaut à 'true'

  useEffect(() => {
    if (typeof window !== "undefined") {
      const connection =
        (navigator as ExtendedNavigator).connection ||
        (navigator as ExtendedNavigator).mozConnection ||
        (navigator as ExtendedNavigator).webkitConnection;
      if (
        connection &&
        (connection.rtt > 300 ||
          connection.effectiveType === "3g" ||
          connection.effectiveType === "slow-3g" ||
          connection.effectiveType === "2g" ||
          connection.effectiveType === "slow-2g")
      ) {
        setActive(false);
      }
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isMounted) {
      controls.start("visible");
    }
  }, [controls, isMounted]);

  // Toujours utiliser 'motion.div' pour permettre le scroll
  return (
    <motion.div style={{ scale }}>
      {active ? (
        <MotionWrapperDynamic
          animate={controls}
          initial="hidden"
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}>
          {children}
        </MotionWrapperDynamic>
      ) : (
        <>{children}</>
      )}
    </motion.div>
  );
};


export default MotionScroll;
