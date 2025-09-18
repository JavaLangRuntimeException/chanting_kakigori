"use client";

import { useEffect, useState } from "react";
import { Content } from "./Content";
import { SplashScreen } from "./SplashScreen";

export function PageWrapper() {
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowContent(true);
		}, 2100);

		return () => clearTimeout(timer);
	}, []);

	return (
		<>
			<SplashScreen />
			{showContent && <Content />}
		</>
	);
}
