import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
	images: string[];
	alt?: string;
	className?: string;
	autoPlay?: boolean;
	intervalMs?: number;
}

export default function Carousel({
	images,
	alt = 'Image',
	className = '',
	autoPlay = true,
	intervalMs = 5000,
}: CarouselProps) {
	const validImages = (images || []).filter(Boolean);
	const [currentIndex, setCurrentIndex] = useState(0);

	const next = () => {
		setCurrentIndex((prev) => (prev + 1) % Math.max(validImages.length, 1));
	};

	const prev = () => {
		setCurrentIndex((prev) => (prev - 1 + Math.max(validImages.length, 1)) % Math.max(validImages.length, 1));
	};

	useEffect(() => {
		if (!autoPlay || validImages.length <= 1) return;
		const timer = setInterval(next, intervalMs);
		return () => clearInterval(timer);
	}, [autoPlay, intervalMs, validImages.length]);

	if (validImages.length === 0) {
		return (
			<div className={`w-full h-full bg-gray-100 ${className}`}></div>
		);
	}

	return (
		<div className={`relative w-full h-full overflow-hidden ${className}`}>
			<img
				src={validImages[currentIndex]}
				alt={alt}
				className="w-full h-full object-cover"
			/>
			{validImages.length > 1 && (
				<>
					<button
						type="button"
						onClick={prev}
						className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
						aria-label="Previous image"
					>
						<ChevronLeft className="h-5 w-5" />
					</button>
					<button
						type="button"
						onClick={next}
						className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
						aria-label="Next image"
					>
						<ChevronRight className="h-5 w-5" />
					</button>
					<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
						{validImages.map((_, i) => (
							<button
								key={i}
								onClick={() => setCurrentIndex(i)}
								className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`}
								aria-label={`Go to slide ${i + 1}`}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
} 