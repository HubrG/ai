"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Webscrap() {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string>("");

  const prompt = input;

  const generateResponse = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setResponse("");
    setLoading(true);

    const response = await fetch("/api/webscrap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setResponse((prev) => prev + chunkValue);
    }
    setLoading(false);
  };
  function createMarkup(text: string) {
    // Remplacer les sauts de ligne par des balises <br>
    const htmlText = text.replace(/\n/g, "<br>");
    return { __html: htmlText };
  }

  return (
    <div className="w-full grid grid-cols-2 gap-2">
      <div className="w-5/6">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
       
          placeholder={"https://website.com"}
        />
        {!loading ? (
          <Button
            className="w-full"
            onClick={(e) => generateResponse(e)}>
            Générer le mail &rarr;
          </Button>
        ) : (
          <button
            disabled
            className="w-full rounded-xl bg-red-500 px-4 py-2 font-medium text-white">
            <div className="animate-pulse font-bold tracking-widest">...</div>
          </button>
        )}
      </div>
      <div className="mt-8 rounded-xl border bg-red-500 p-4 shadow-md transition hover:bg-gray-100">
        {response && (
          //   On autorise le html dans le innerHTML
          <p
            className="mt-8 rounded-xl border bg-white p-4 text-left shadow-md transition hover:bg-gray-100"
            dangerouslySetInnerHTML={createMarkup(response)}
          />
        )}
      </div>
    </div>
  );
}
