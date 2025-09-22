"use client";

import { useEffect, useState } from "react";
import { Content } from "./Content";
import { SplashScreen } from "./SplashScreen";

export function PageWrapper() {
	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowSplash(false);
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	return <>{showSplash ? <SplashScreen /> : <Content />}</>;
}
