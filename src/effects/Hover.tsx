"use client";
import { motion, TargetAndTransition, VariantLabels } from "framer-motion";
import React from "react";

/**
 * `MotionHover` est un composant qui applique une animation spécifiée à ses enfants lorsqu'ils sont survolés.
 *
 * @param type Type d'animation à appliquer au survol.
 * - `scale` : Agrandit légèrement l'élément.
 * - `lift` : Élève l'élément et applique une ombre.
 * - `liftWithoutShadow` : Élève l'élément sans appliquer d'ombre.
 * - `rotate` : Fait légèrement tourner l'élément.
 * - `color` : Modifie la couleur d'arrière-plan de l'élément.
 * - `bounce` : Fait rebondir l'élément indéfiniment.
 * - `pulse` : Fait pulser l'élément (agrandissement et rétrécissement) indéfiniment.
 * - `swing` : Fait balancer l'élément d'un côté à l'autre indéfiniment.
 * - `grow` : Agrandit l'élément et le maintient agrandi tant qu'il est survolé.
 */

type AnimationType =
  | "scale"
  | "lift"
  | "liftWithoutShadow"
  | "rotate"
  | "color"
  | "bounce"
  | "pulse"
  | "swing"
  | "grow";

interface AnimatedWrapperProps {
  children: React.ReactNode;
  type: AnimationType;
  duration?: number;
  scale?: number;
  y?: number;
  rotate?: number;
  shadow?: string;
  rounded?: string;
}

const MotionHover: React.FC<AnimatedWrapperProps> = ({
  children,
  type = "scale",
  scale = 1.05,
  y = -10,
  rotate = 5,
  duration = 0.3,
  shadow = "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  rounded = "0.5rem"
}) => {
  const hoverAnimations: Record<
    AnimationType,
    TargetAndTransition | VariantLabels
  > = {
    scale: {
      scale: scale,
      transition: { duration: duration },
      boxShadow: shadow,
      borderRadius: rounded
    },
    lift: {
      y: y,
      boxShadow: shadow,
      transition: { duration: duration },
      borderRadius: rounded

    },
    liftWithoutShadow: {
      y: y,
      transition: { duration: duration },
      boxShadow: shadow,
      borderRadius: rounded

    },
    rotate: {
      rotate: rotate,
      transition: { duration: duration },
      boxShadow: shadow,
      borderRadius: rounded

    },
    color: {
      backgroundColor: "var(--color-app1)",
      transition: { duration: duration },
      boxShadow: shadow,
      borderRadius: rounded

    },
    bounce: {
      y: [0, -8, 0],
      transition: {
        duration: duration,
        repeat: Infinity,
        repeatType: "mirror" as const,
        boxShadow: shadow,
        borderRadius: rounded

      },
    },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: duration,
        repeat: Infinity,
        repeatType: "mirror" as const,
        boxShadow: shadow,
        borderRadius: rounded

      },
    },
    swing: {
      rotate: [0, 10, -10, 0],
      transition: {
        duration: duration,
        repeat: Infinity,
        repeatType: "mirror" as const,
        boxShadow: shadow,
        borderRadius: rounded

      },
    },
    grow: {
      scale: scale,
      transition: { duration: duration },
      boxShadow: shadow,
      borderRadius: rounded

    },
  };

  return <motion.div whileHover={hoverAnimations[type]}>{children}</motion.div>;
};

export default MotionHover;
