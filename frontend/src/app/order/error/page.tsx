"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentStepAtom, selectedMenuAtom } from "@/store/atoms";

export default function ErrorPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);
	const [showToast, setShowToast] = useState(false);

	useEffect(() => {
		setCurrentStep("error");
		setShowToast(true);

		const timer = setTimeout(() => {
			setCurrentStep("waiting_room");
			router.push("/waiting");
		}, 3000);

		return () => clearTimeout(timer);
	}, [router, setCurrentStep]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full text-center">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-6xl mb-4">❄️</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						会場が冷え切っています
					</h1>
					<p className="text-gray-600 mb-6">
						かき氷を注文するには、
						<br />
						会場をもっと盛り上げる必要があります！
					</p>
					{selectedMenu && (
						<div className="bg-blue-50 rounded-lg p-4 mb-6">
							<p className="text-sm text-gray-600">選択中のメニュー</p>
							<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
						</div>
					)}
					<p className="text-sm text-gray-500">
						まもなく待機ルームへ移動します...
					</p>
				</div>
			</div>

			{showToast && (
				<div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right">
					<p className="font-medium">
						会場が冷え切っているため、かき氷は注文できませんでした
					</p>
				</div>
			)}
		</div>
	);
}
