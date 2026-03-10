import React, { useState, useEffect } from 'react';
import { Heart, Apple, Coffee, Dumbbell, Moon, Brain, Sparkles, Droplets } from 'lucide-react';

const tips = [
    {
        category: 'Fruit health benefits',
        tip: 'Apples are rich in fiber and support digestive health.',
        proTip: 'Eat them with the skin on for maximum nutrients!',
        icon: Apple,
        color: 'text-red-500',
        bg: 'bg-red-50'
    },
    {
        category: 'Hydration reminders',
        tip: 'Drink at least 2 liters of water daily to stay hydrated.',
        proTip: 'Keep a water bottle near your desk as a visual reminder.',
        icon: Droplets,
        color: 'text-blue-500',
        bg: 'bg-blue-50'
    },
    {
        category: 'Exercise suggestions',
        tip: 'A 20-minute walk can improve cardiovascular health.',
        proTip: 'Try walking after meals to aid digestion and lower blood sugar.',
        icon: Dumbbell,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
    },
    {
        category: 'Food nutrition tips',
        tip: 'Bananas contain potassium which supports healthy blood pressure.',
        proTip: 'They make a perfect pre-workout natural energy snack.',
        icon: Apple,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50'
    },
    {
        category: 'Mental wellness tips',
        tip: 'Almonds provide healthy fats and support brain health.',
        proTip: 'A handful (about 23 almonds) is a perfect daily portion.',
        icon: Brain,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
    },
    {
        category: 'Sleep improvement tips',
        tip: 'Aim for 7-9 hours of quality sleep each night for recovery.',
        proTip: 'Avoid screens 1 hour before bed for better deep sleep phases.',
        icon: Moon,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50'
    }
];

const ROTATION_INTERVAL_MS = 3 * 60 * 60 * 1000;

// Extracted outside to avoid ESLint warnings and ensure purity
const calculateTipIndex = () => {
    return Math.floor(Date.now() / ROTATION_INTERVAL_MS) % tips.length;
};

const HealthTipCard = () => {
    // Lazy evaluation for initial state
    const [currentIndex, setCurrentIndex] = useState(() => calculateTipIndex());
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleRotation = () => {
            const nextIndex = calculateTipIndex();
            if (nextIndex !== currentIndex) {
                setIsVisible(false);
                setTimeout(() => {
                    setCurrentIndex(nextIndex);
                    setIsVisible(true);
                }, 500);
            }
        };

        const intervalId = setInterval(handleRotation, 60000);
        return () => clearInterval(intervalId);
    }, [currentIndex]);

    const currentTip = tips[currentIndex];
    const Icon = currentTip.icon || Heart;

    return (
        <div className="glass-card bg-gradient-to-br from-white to-slate-50 border border-slate-100 overflow-hidden relative group animate-fade-in delay-500">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div className="relative z-10 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                        <h3 className="text-sm sm:text-base font-black text-emerald-800 uppercase tracking-widest leading-tight">
                            Small healthy choices make a big difference
                        </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 pb-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
                        {currentTip.category}
                    </span>
                </div>

                <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                        <div className={`w-16 h-16 rounded-2xl ${currentTip.bg} flex items-center justify-center flex-shrink-0 shadow-inner border border-white mx-auto sm:mx-0`}>
                            <Icon className={`w-8 h-8 ${currentTip.color}`} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xl sm:text-2xl font-black text-slate-800 leading-tight mb-3">
                                {currentTip.tip}
                            </p>
                            {currentTip.proTip && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pro Tip</span>
                                    <span className="text-xs sm:text-sm font-semibold text-slate-600">{currentTip.proTip}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthTipCard;
