"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function SplashScreen() {
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(false);
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
			<div className="relative animate-fade-in bg-black rounded-full flex items-center justify-center w-72 h-72">
				<Image
					src="/giiku-logo.webp"
					alt="技育祭"
					width={180}
					height={180}
					className="animate-scale-in"
					priority
				/>
				<div className="absolute -bottom-8 left-0 right-0 flex justify-center">
					<div className="flex gap-2">
						<span className="h-3 w-3 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
						<span className="h-3 w-3 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
						<span className="h-3 w-3 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
					</div>
				</div>
			</div>
		</div>
	);
}
