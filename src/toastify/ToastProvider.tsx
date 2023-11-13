'use client';

import { Slide, ToastContainer } from 'react-toastify';

interface ToastProviderProps {
	children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
	return (
		<>
			{children}
			<ToastContainer   newestOnTop={true} transition={Slide} />
		</>
	);
}