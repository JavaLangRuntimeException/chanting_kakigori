"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentStepAtom } from "@/store/atoms";

export default function OrderLoadingPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [showToast, setShowToast] = useState(false);
	const [line1, setLine1] = useState("");
	const [line2, setLine2] = useState("");

	useEffect(() => {
		setCurrentStep("order_loading");

		const timer = setTimeout(() => {
			setShowToast(true);

			setTimeout(() => {
				setCurrentStep("waiting_room");
				router.push("/waiting");
			}, 4000);
		}, 2000);

		return () => clearTimeout(timer);
	}, [router, setCurrentStep]);

	useEffect(() => {
		if (showToast) {
			const fullLine1 = "会場が冷え切っているため、";
			const fullLine2 = "かき氷は注文できませんでした";
			let i = 0;
			const typingInterval = setInterval(() => {
				if (i < fullLine1.length) {
					setLine1(fullLine1.slice(0, i + 1));
				} else {
					const j = i - fullLine1.length;
					if (j < fullLine2.length) {
						setLine2(fullLine2.slice(0, j + 1));
					} else {
						clearInterval(typingInterval);
					}
				}
				i++;
				// }, 100); // typing speed
			}, 10000000); // typing speed

			return () => clearInterval(typingInterval);
		}
	}, [showToast]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
			<div className="text-center">
				<div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-red-400" />
				<p className="mt-6 text-xl text-gray-700">注文を処理しています...</p>
			</div>

			{showToast && (
				<div className="fixed inset-x-4 md:inset-x-auto md:left-1/2 top-1/2 md:-translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-8 rounded-lg shadow-2xl z-50 md:max-w-md">
					<p className="font-bold text-2xl md:text-2xl text-center leading-relaxed">
						{line1}
						{line2 && <br className="sm:hidden" />}
						{line2}
					</p>
				</div>
			)}
		</div>
	);
}
