import React from 'react';
import HeroSlideshow from './HeroSlideshow';

export const slideshowImages = [
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=2091&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1584982751034-18872023d47a?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
];

const BackgroundSlideshow = ({ intensity = 'dashboard' }) => {
    // Determine overlay opacity based on use case
    // For heroes/login pages: lighter overlay
    // For dashboards: heavier overlay for text readability

    const overlays = {
        'light': 'bg-white/10 dark:bg-slate-950/45',
        'auth-left': 'bg-primary-900/60 dark:bg-slate-950/70',
        'auth-full': 'bg-white/40 dark:bg-slate-950/70 backdrop-blur-[2px]',
        'dashboard': 'bg-white/60 dark:bg-slate-950/80 backdrop-blur-md'
    };

    const overlayClass = overlays[intensity] || overlays['dashboard'];

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <HeroSlideshow images={slideshowImages} interval={5000} />
            <div className={`absolute inset-0 transition-colors duration-500 ${overlayClass}`}></div>
        </div>
    );
};

export default BackgroundSlideshow;
