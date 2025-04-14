"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Shield, Coins, Repeat, Trash2 } from "lucide-react";

export default function TokenizationProcess() {
	const [activeStep, setActiveStep] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [blockHashes, setBlockHashes] = useState<string[]>([]);
	const sectionRef = useRef<HTMLDivElement>(null);

	// Generate block hashes on client-side only
	useEffect(() => {
		// Solana transaction hashes are base58 encoded and 88 characters long
		const generateSolanaHash = () => {
			const chars =
				"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
			return Array.from({ length: 88 }, () =>
				chars.charAt(Math.floor(Math.random() * chars.length))
			).join("");
		};

		const hashes = Array.from({ length: 10 }).map(() =>
			generateSolanaHash()
		);
		setBlockHashes(hashes);
	}, []);

	// Auto-advance steps
	useEffect(() => {
		if (!isVisible) return;

		const interval = setInterval(() => {
			setActiveStep((prev) => (prev + 1) % 4);
		}, 1000);

		return () => clearInterval(interval);
	}, [isVisible]);

	// Intersection observer to trigger animations when section is visible
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.2 }
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => observer.disconnect();
	}, []);

	const steps = [
		{
			title: "Verification & Certification",
			description:
				"Carbon credits are sourced from verified sustainability projects, ensuring compliance with international standards.",
			icon: <Shield className="h-8 w-8" />,
		},
		{
			title: "On-Chain Minting",
			description:
				"Each verified credit is tokenized as a unique SPL (Solana Program Library) token, maintaining an immutable and auditable history.",
			icon: <Coins className="h-8 w-8" />,
		},
		{
			title: "Ownership & Trading",
			description:
				"Tokenized credits can be freely transferred, sold, or held, allowing for seamless participation in carbon markets.",
			icon: <Repeat className="h-8 w-8" />,
		},
		{
			title: "Retirement & Proof of Offset",
			description:
				"Once used to offset emissions, tokens are permanently burned on-chain, providing cryptographic proof of environmental impact.",
			icon: <Trash2 className="h-8 w-8" />,
		},
	];

	const benefits = [
		{
			title: "Ultra-Low Fees",
			description:
				"Transactions cost a fraction of a cent, making microtransactions and frequent trading viable.",
		},
		{
			title: "High Throughput & Speed",
			description:
				"Solana processes thousands of transactions per second with near-instant finality.",
		},
		{
			title: "Transparency & Security",
			description:
				"All transactions are recorded immutably, eliminating double spending and fraud risks.",
		},
		{
			title: "Global Accessibility",
			description:
				"Enterprises and individuals can access and trade carbon credits from anywhere without intermediaries.",
		},
	];

	return (
		<section ref={sectionRef} className="py-24">
			<div className="container mx-auto px-4 max-w-6xl">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-6">
						Tokenization of Carbon Credits
					</h2>
					<p className="text-xl text-gray-300 max-w-3xl mx-auto">
						CarbonPay leverages blockchain technology to tokenize
						verified carbon credits, transforming them into digital
						assets that can be securely traded, tracked, and retired
						in real-time on Solana.
					</p>
				</div>

				{/* Tokenization Process Visualization */}
				<div className="mb-20">
					<h3 className="text-2xl font-semibold mb-8 text-center">
						Tokenization Process
					</h3>

					<div className="relative">
						{/* Process Steps */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							{steps.map((step, index) => (
								<div
									key={index}
									className={`bg-black/40 border rounded-xl p-6 transition-all duration-500 ${
										activeStep === index
											? "border-green-500 scale-105 shadow-[0_0_15px_rgba(5,169,79,0.3)]"
											: "border-white/10"
									}`}
									onClick={() => setActiveStep(index)}
								>
									<div
										className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${
											activeStep === index
												? "bg-green-600"
												: "bg-gray-800"
										}`}
									>
										{activeStep === index ? (
											<span className="text-white font-bold">
												{index + 1}
											</span>
										) : (
											<span className="text-gray-400 font-bold">
												{index + 1}
											</span>
										)}
									</div>

									<div
										className={`mb-3 transition-colors duration-300 ${
											activeStep === index
												? "text-green-500"
												: "text-gray-300"
										}`}
									>
										{step.icon}
									</div>

									<h4 className="text-lg font-semibold mb-2">
										{step.title}
									</h4>
									<p className="text-gray-400 text-sm">
										{step.description}
									</p>
								</div>
							))}
						</div>

						{/* Connecting Lines (Desktop only) */}
						<div className="hidden md:block absolute top-1/3 left-0 right-0 z-[-1]">
							<div className="h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent w-full" />

							{/* Animated Token */}
							<div
								className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(5,169,79,0.8)]"
								style={{
									left: `${activeStep * 33.3 + 8.3}%`,
									transition: "left 1s ease-in-out",
								}}
							/>
						</div>
					</div>
				</div>

				{/* Why Solana Section */}
				<div>
					<h3 className="text-2xl font-semibold mb-8 text-center">
						Why Tokenize on Solana?
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div
							className={`transition-all duration-1000 ${
								isVisible
									? "opacity-100 translate-x-0"
									: "opacity-0 -translate-x-12"
							}`}
						>
							<div className="space-y-6">
								{benefits.map((benefit, index) => (
									<div key={index} className="flex gap-4">
										<div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
											<Check className="h-5 w-5 text-green-500" />
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-1">
												{benefit.title}
											</h4>
											<p className="text-gray-400">
												{benefit.description}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div
							className={`transition-all duration-1000 delay-300 ${
								isVisible
									? "opacity-100 translate-x-0"
									: "opacity-0 translate-x-12"
							}`}
						>
							{/* Solana Blockchain Visualization */}
							<div className="bg-black/40 border border-white/10 rounded-xl p-6 h-full">
								<div className="flex items-center justify-between mb-6">
									<h4 className="font-semibold">
										Solana Blockchain
									</h4>
									<div className="flex items-center">
										<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
										<span className="text-sm text-green-500">
											Live Network
										</span>
									</div>
								</div>

								<div className="relative h-[300px] overflow-hidden">
									{/* Animated blockchain blocks */}
									<div className="absolute inset-0">
										{blockHashes.length > 0
											? Array.from({ length: 10 }).map(
													(_, i) => (
														<div
															key={i}
															className="absolute bg-black/60 border border-green-500/30 rounded-md p-3 w-[180px] shadow-lg"
															style={{
																top: `${
																	30 + i * 25
																}px`,
																left: `${
																	50 + i * 15
																}px`,
																transform: `rotate(${
																	i % 2 === 0
																		? -2
																		: 2
																}deg)`,
																zIndex: 10 - i,
																opacity:
																	1 -
																	i * 0.08,
															}}
														>
															<div className="flex justify-between items-center mb-2">
																<div className="text-xs text-gray-400">
																	Block #
																	{(
																		9999999 -
																		i
																	).toLocaleString()}
																</div>
																<div className="text-xs text-green-500">
																	{(
																		0.4 +
																		i * 0.1
																	).toFixed(
																		1
																	)}
																	s
																</div>
															</div>
															<div className="flex gap-2 mb-2">
																{Array.from({
																	length: 3,
																}).map(
																	(_, j) => (
																		<div
																			key={
																				j
																			}
																			className="h-1 flex-1 rounded-full bg-green-500/30"
																		></div>
																	)
																)}
															</div>
															<div className="text-xs text-gray-500 truncate">
																{blockHashes[i]
																	? `${blockHashes[
																			i
																	  ].substring(
																			0,
																			12
																	  )}...`
																	: "Loading..."}
															</div>
														</div>
													)
											  )
											: // Placeholder content while client-side rendering happens
											  Array.from({ length: 10 }).map(
													(_, i) => (
														<div
															key={i}
															className="absolute bg-black/60 border border-green-500/30 rounded-md p-3 w-[180px] shadow-lg"
															style={{
																top: `${
																	30 + i * 25
																}px`,
																left: `${
																	50 + i * 15
																}px`,
																transform: `rotate(${
																	i % 2 === 0
																		? -2
																		: 2
																}deg)`,
																zIndex: 10 - i,
																opacity:
																	1 -
																	i * 0.08,
															}}
														>
															<div className="flex justify-between items-center mb-2">
																<div className="text-xs text-gray-400">
																	Block #
																	{(
																		9999999 -
																		i
																	).toLocaleString()}
																</div>
																<div className="text-xs text-green-500">
																	{(
																		0.4 +
																		i * 0.1
																	).toFixed(
																		1
																	)}
																	s
																</div>
															</div>
															<div className="flex gap-2 mb-2">
																{Array.from({
																	length: 3,
																}).map(
																	(_, j) => (
																		<div
																			key={
																				j
																			}
																			className="h-1 flex-1 rounded-full bg-green-500/30"
																		></div>
																	)
																)}
															</div>
															<div className="text-xs text-gray-500 truncate">
																Loading...
															</div>
														</div>
													)
											  )}
									</div>

									{/* Stats overlay */}
									<div className="absolute bottom-0 right-0 bg-black/80 border border-white/10 rounded-tl-lg p-3">
										<div className="grid grid-cols-2 gap-3 text-sm">
											<div>
												<div className="text-gray-400">
													TPS
												</div>
												<div className="font-mono">
													4,128
												</div>
											</div>
											<div>
												<div className="text-gray-400">
													Fee
												</div>
												<div className="font-mono">
													$0.00025
												</div>
											</div>
											<div>
												<div className="text-gray-400">
													Finality
												</div>
												<div className="font-mono">
													400ms
												</div>
											</div>
											<div>
												<div className="text-gray-400">
													Credits
												</div>
												<div className="font-mono">
													1.2M+
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="mt-6 text-center text-sm text-gray-400">
									By bringing carbon markets on-chain,
									CarbonPay eliminates inefficiencies,
									enhances credibility, and unlocks new
									possibilities for sustainable finance at a
									global scale.
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
