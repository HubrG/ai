"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

type MotionParallaxProps = {
  children: React.ReactNode;
  speed?: number;
  type?: 0 | 1 | 2 | 3 | 4;
  opacity?:number
};

const MotionParallax: React.FC<MotionParallaxProps> = ({
  children,
  speed = 0.2,
  type = 0,
  opacity = 1
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const transformValue = useMemo(() => {
    const opacityValue = 1 - scrollY / 400; // Diminue l'opacité de 0.5 unité pour chaque 100 pixels défilés
    const clampedOpacity = Math.max(opacity, Math.min(opacityValue, 1)); // Assure que l'opacité reste entre 0.5 et 1

    switch (type) {
      case 0: // MotionParallaxe verticale vers le haut
        return { y: -scrollY * speed, opacity: clampedOpacity };
      case 1: // MotionParallaxe verticale vers le bas
        return { y: scrollY * speed, opacity: clampedOpacity };
      case 2: // MotionParallaxe horizontale vers la gauche
        return { x: -scrollY * speed, opacity: clampedOpacity };
      case 3: // MotionParallaxe horizontale vers la droite
        return { x: scrollY * speed, opacity: clampedOpacity };
      case 4: // MotionParallaxe diagonale
        return { x: scrollY * speed, y: scrollY * speed, opacity: clampedOpacity };
      default:
        return { y: -scrollY * speed, opacity: clampedOpacity };
    }
  }, [scrollY, speed, type, opacity]); // Les dépendances indiquent quand recalcule la valeur

  return <motion.div style={transformValue}>{children}</motion.div>;
};

export default MotionParallax;
