"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { currentStepAtom } from "@/store/atoms";

export default function OrderLoadingPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);

	useEffect(() => {
		setCurrentStep("order_loading");

		const timer = setTimeout(() => {
			setCurrentStep("error");
			router.push("/order/error");
		}, 2000);

		return () => clearTimeout(timer);
	}, [router, setCurrentStep]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
			<div className="text-center">
				<div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
				<p className="mt-6 text-xl text-gray-700">注文を処理しています...</p>
			</div>
		</div>
	);
}
