import React, { useState, useEffect } from 'react';

const HeroSlideshow = ({ images, interval = 3500 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images, interval]);

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <div className="hero-slideshow absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {images.map((image, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out"
                    style={{
                        backgroundImage: `url(${image})`,
                        opacity: index === currentIndex ? 0.3 : 0,
                    }}
                >
                    {/* Optional: Add a subtle overlay if needed for extra text protection */}
                    {/* <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div> */}
                </div>
            ))}
        </div>
    );
};

export default HeroSlideshow;
