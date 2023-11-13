"use client";
import { motion, useAnimation } from "framer-motion";
import React, { useLayoutEffect, useState, useEffect } from "react";

interface LevitatingWrapperProps {
  children: React.ReactNode;
  duration?: number;
  amp?: number;
}

const MotionLevitation: React.FC<LevitatingWrapperProps> = ({
  children,
  duration = 0.5,
  amp = 0.005,
}) => {
  const controls = useAnimation();
  const [initialPhase, setInitialPhase] = useState(Math.random() * 2 * Math.PI);  // phase initiale aléatoire

  useEffect(() => {
    setInitialPhase(Math.random() * 2 * Math.PI);  // Réinitialise la phase initiale à chaque montage/remontage
  }, []);

  useLayoutEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      const time = Date.now() * duration + initialPhase;  // Ajoute la phase initiale aux fonctions sinus et cosinus
      const x = Math.sin(time) * amp;
      const y = Math.cos(time) * amp;
      controls.set({ x, y });
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();

    // Cleanup the animation frame request when the component unmounts
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [controls, duration, amp, initialPhase]);  // Ajoute initialPhase aux dépendances

  return <motion.div animate={controls}>{children}</motion.div>;
};

export default MotionLevitation;
