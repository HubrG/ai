import React from "react"

const Skeleton = (props:any) => (
  
<div role="status" className="max-w-sm animate-pulse p-10">
	<div className="h-2.5 bg-app-200 rounded-full dark:bg-app-700 w-48 mb-4"></div>
	<div className="h-2 bg-app-200 rounded-full dark:bg-app-700 max-w-[360px] mb-2.5"></div>
	<div className="h-2 bg-app-200 rounded-full dark:bg-app-700 mb-2.5"></div>
	<div className="h-2 bg-app-200 rounded-full dark:bg-app-700 max-w-[330px] mb-2.5"></div>
	<div className="h-2 bg-app-200 rounded-full dark:bg-app-700 max-w-[300px] mb-2.5"></div>
	<div className="h-2 bg-app-200 rounded-full dark:bg-app-700 max-w-[360px]"></div>
	<span className="sr-only">Loading...</span>
</div>

)

export default Skeleton