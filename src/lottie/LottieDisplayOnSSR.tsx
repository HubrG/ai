"use client";
import animationValidation from "./lottie-validation.json";
import animation404 from "./lottie-404.json";
import animationLoader from "./lottie-loader.json";
import Lottie from "react-lottie-player";
type Lottie = {
  autoplay?: boolean;
  animation: string;
  loop?: boolean;
};

export const LottieDisplayOnSSR = ({ animation, autoplay = true, loop = false }: Lottie) => {
  let illustration;
  if (animation === "validation") {
    illustration = animationValidation;
  }
  if (animation === "404") {
    illustration = animation404;
  }
  if (animation === "loader") {
    illustration = animationLoader;
  }


  return (
    <>
   
      <Lottie
        loop={loop}
        play={autoplay}
        animationData={illustration}
        style={{ width: "100%", height: "100%" }}
        rendererSettings={{
          preserveAspectRatio: "xMidYMid slice",
        }} />
    </>
    // <Lottie
    //   loop={loop}
    //   autoplay={autoplay}
    //   animationData={illustration}
    //   style={{ width: "100%", height: "100%" }}
    //   rendererSettings={{
    //     preserveAspectRatio: "xMidYMid slice",
    //   }}
    // />
  );
};
