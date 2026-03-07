import { useState, useEffect } from 'react';
import { Pill, Activity, Stethoscope, HeartPulse, Dna, Syringe, Cross, Building, UserRound, ClipboardList, TestTube } from 'lucide-react';

const IntroScreen = ({ onComplete }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Updated timing for letter-by-letter, plus rotation, and sparkle
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            const removeTimer = setTimeout(() => {
                onComplete();
            }, 2000); // 2.0s for an extremely slow, premium transition

            return () => clearTimeout(removeTimer);
        }, 3400); // Start fade-out slightly earlier to blend with final animations

        return () => clearTimeout(timer);
    }, [onComplete]);

    const secureText = "Secure".split('');
    const careText = "Care".split('');

    // Background Icon Configuration
    const bgIcons = [
        { Icon: Pill, top: '20%', left: '15%', delay: '0s', size: 32 },
        { Icon: Activity, top: '10%', left: '70%', delay: '1.2s', size: 40 },
        { Icon: Stethoscope, top: '65%', left: '25%', delay: '0.5s', size: 36 },
        { Icon: HeartPulse, top: '80%', left: '80%', delay: '2.1s', size: 48, customColor: 'text-red-400' }, // Heart Pulse in red
        { Icon: Dna, top: '50%', left: '10%', delay: '1.5s', size: 40 },
        { Icon: Syringe, top: '35%', left: '85%', delay: '0.8s', size: 32 },
        { Icon: Cross, top: '75%', left: '55%', delay: '2.5s', size: 36 },
        { Icon: Building, top: '40%', left: '45%', delay: '1.8s', size: 48 },
        // Expanded network density
        { Icon: UserRound, top: '85%', left: '12%', delay: '3.1s', size: 36 },
        { Icon: Dna, top: '15%', left: '45%', delay: '2.8s', size: 32 },
        { Icon: ClipboardList, top: '55%', left: '90%', delay: '1.1s', size: 32 },
        { Icon: Activity, top: '25%', left: '92%', delay: '3.5s', size: 28 },
        { Icon: Pill, top: '88%', left: '40%', delay: '0.3s', size: 28 },
        { Icon: HeartPulse, top: '12%', left: '88%', delay: '0.9s', size: 36, customColor: 'text-red-400' }, // Secondary Heart Pulse in red
        { Icon: TestTube, top: '45%', left: '25%', delay: '2.2s', size: 40 },
        { Icon: Cross, top: '60%', left: '70%', delay: '1.7s', size: 32 },
        { Icon: Stethoscope, top: '30%', left: '5%', delay: '2.9s', size: 44 },
    ];

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-[2000ms] ease-in-out ${isFadingOut ? 'bg-white/0 opacity-0 pointer-events-none translate-y-[-50px] backdrop-blur-md' : 'bg-white opacity-100 translate-y-0'
                }`}
        >
            {/* Animated Medical Network Background (Hexagons/Icons) */}
            <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-all duration-1000 ${isFadingOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
                {bgIcons.map((item, index) => {
                    const { Icon, top, left, delay, size, customColor } = item;
                    // Colors alternating softly, or use customColor if provided
                    const color = customColor ? customColor : (index % 2 === 0 ? 'text-[#6ED3C2]' : 'text-slate-300');
                    return (
                        <div
                            key={`bg-icon-${index}`}
                            className="absolute animate-[network-fade_4s_ease-in-out_infinite]"
                            style={{ top, left, animationDelay: delay }}
                        >
                            <div className="relative animate-[float-gentle_3s_ease-in-out_infinite] flex items-center justify-center">
                                {/* Hexagon outline behind the icon */}
                                <svg className={`absolute ${color} opacity-40`} width={size * 1.8} height={size * 1.8} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
                                    {/* Small connecting lines */}
                                    <line x1="95" y1="25" x2="110" y2="15" strokeWidth="1" />
                                    <line x1="5" y1="75" x2="-10" y2="85" strokeWidth="1" />
                                </svg>

                                {/* Inner Icon */}
                                <Icon className={`${color} opacity-80 z-10`} size={size} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={`flex items-center text-6xl md:text-7xl lg:text-8xl font-extrabold font-heading tracking-tight relative cursor-default transition-all duration-[2000ms] ease-in-out z-10 antialiased ${isFadingOut ? 'scale-110 opacity-0 blur-md translate-y-[-20px]' : 'scale-100 opacity-100 blur-0 translate-y-0'
                }`}>

                {/* "Secure" with sequenced sliding letters */}
                <span className="text-black inline-flex">
                    {secureText.map((char, index) => (
                        <span
                            key={`sec-${index}`}
                            className="inline-block opacity-0 transform-gpu animate-[intro-letter_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                            style={{ animationDelay: `${index * 0.12}s` }}
                        >
                            {char}
                        </span>
                    ))}
                </span>

                {/* "Care" with sequenced sliding letters */}
                <span className="text-[#6ED3C2] inline-flex">
                    {careText.map((char, index) => (
                        <span
                            key={`car-${index}`}
                            className="inline-block opacity-0 transform-gpu animate-[intro-letter_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                            style={{ animationDelay: `${(secureText.length + index) * 0.12}s` }}
                        >
                            {char}
                        </span>
                    ))}
                </span>

                <div className="relative inline-flex items-center">
                    {/* The Plus Icon */}
                    <span
                        className="text-[#6ED3C2] inline-block opacity-0 transform-gpu animate-[intro-plus_1.2s_cubic-bezier(0.25,0.1,0.25,1)_forwards] origin-center"
                        style={{ animationDelay: `${(secureText.length + careText.length) * 0.12 + 0.2}s` }}
                    >
                        +
                    </span>

                    {/* The Sparkle */}
                    <svg
                        className="absolute -top-[5%] -right-[75%] w-8 h-8 md:w-12 md:h-12 text-[#6ED3C2] opacity-0 transform-gpu animate-[intro-sparkle_0.8s_ease-in-out_forwards] pointer-events-none"
                        style={{ animationDelay: `${(secureText.length + careText.length) * 0.12 + 0.9}s` }}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default IntroScreen;
