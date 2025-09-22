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
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
			<div className="text-center">
				<div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
				<p className="mt-6 text-xl text-gray-700">注文を処理しています...</p>
			</div>

			{showToast && (
				<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-8 py-6 rounded-lg shadow-2xl z-50 animate-fade-in">
					<p className="font-medium text-lg text-center">
						会場が冷え切っているため、かき氷は注文できませんでした
					</p>
				</div>
			)}
		</div>
	);
}
