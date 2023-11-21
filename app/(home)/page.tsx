// import Webscrap from "@/src/feature/main-feature/ai-webscrap/Webscrap";

export default async function Home() {

  return (
    <>
      <div className="flex flex-col gap-y-10 w-full">
        <div>
          <h2 className="my-4 text-6xl font-bold">Scrap internet</h2>
          <p className="font-bold">
            Ask a question.
            <span className="text-red-400">(Max. 200 characters)</span>
          </p>
          {/* <Webscrap /> */}
        </div>
        
      </div>
    </>
  );
}
