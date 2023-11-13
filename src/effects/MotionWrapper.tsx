import { motion, useAnimation, Variants } from "framer-motion";
import React, { forwardRef } from 'react';


const variants: { [key: string]: Variants } = {
    BottomToTop: {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 100 },
      },
      TopToBottom: {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: -100 },
      },
      slideIn: {
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: -100 },
      },
      zoomIn: {
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 0.8 },
      },
      rotateIn: {
        visible: { opacity: 1, rotate: 0 },
        hidden: { opacity: 0, rotate: 90 },
      },
      bounceIn: {
        visible: { opacity: 1, scale: [1, 1.1, 1] },
        hidden: { opacity: 0, scale: 0.8 },
      },
      swingIn: {
        visible: { opacity: 1, rotate: [0, 10, -10, 0] },
        hidden: { opacity: 0, rotate: 60 },
      },
      slideInFromRight: {
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: 100 },
      },
      slideInFromLeft: {
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: -100 },
      },
      slideInFromTop: {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: -100 },
      },
      slideInFromBottom: {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 100 },
    },
      rotateInFrom90: {
        visible: { opacity: 1, rotate: 0 },
        hidden: { opacity: 0, rotate: 90 },
      },
      rotateInFromNeg90: {
        visible: { opacity: 1, rotate: 0 },
        hidden: { opacity: 0, rotate: -90 },
      },
      scaleUp: {
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 0.5 },
      },
      scaleDown: {
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 1.5 },
      },
      flipX: {
        visible: { opacity: 1, rotateX: 0 },
        hidden: { opacity: 0, rotateX: 90 },
      },
      flipY: {
        visible: { opacity: 1, rotateY: 0 },
        hidden: { opacity: 0, rotateY: 90 },
      },
  
};

const MotionWrapper = forwardRef((props: any, ref: any) => {
    return <motion.div ref={ref} {...props}>{props.children}</motion.div>;
});

MotionWrapper.displayName = 'MotionWrapper';
export default MotionWrapper;


export { variants };



