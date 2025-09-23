"use client";

import Image from "next/image";

export function SplashScreen() {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
			<div className="relative animate-fade-in bg-black rounded-full flex items-center justify-center w-72 h-72">
				<Image
					src="/giiku-logo.png"
					alt="技育祭"
					width={200}
					height={200}
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
