import Webscrap from "@/src/feature/webscrap/Webscrap";
import Image from "next/image";
import { Button } from "flowbite-react";

export default function Home() {
  return (
    <>
      <h2 className="my-4 text-6xl font-bold">Scrap internet</h2>
   
        <p className="font-bold">
          Ask a question.
          <span className="text-red-400">(Max. 200 characters)</span>
        </p>
   
      <Webscrap />
    </>
  );
}
