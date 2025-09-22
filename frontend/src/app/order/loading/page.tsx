"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentStepAtom } from "@/store/atoms";

export default function OrderLoadingPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [showToast, setShowToast] = useState(false);

	useEffect(() => {
		setCurrentStep("order_loading");

		const timer = setTimeout(() => {
			setShowToast(true);

			setTimeout(() => {
				setCurrentStep("waiting_room");
				router.push("/waiting");
			}, 3000);
		}, 2000);

		return () => clearTimeout(timer);
	}, [router, setCurrentStep]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
			<div className="text-center">
				<div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-red-400" />
				<p className="mt-6 text-xl text-gray-700">注文を処理しています...</p>
			</div>

			{showToast && (
				<div className="fixed inset-x-4 md:inset-x-auto md:left-1/2 top-1/2 md:-translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-8 rounded-lg shadow-2xl z-50 md:max-w-md">
					<p className="font-bold text-2xl md:text-2xl text-center leading-relaxed">
						会場が冷え切っているため、
						<br className="sm:hidden" />
						かき氷は注文できませんでした
					</p>
				</div>
			)}
		</div>
	);
}
