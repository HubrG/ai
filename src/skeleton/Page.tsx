"use client";
import React from "react";
import { LottieDisplayOnSSR } from '@/src/lottie/LottieDisplayOnSSR'

const Loading = (props: any) => {
 
  return (
    <div className="w-full mt-20 min-h-[70vh] px-5 items-center flex justify-center">
      <div role="status" className="space-y-2.5 animate-pulse max-w-xl">
        <LottieDisplayOnSSR animation="loader" />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
