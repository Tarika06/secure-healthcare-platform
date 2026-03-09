import React, { useState, useEffect } from 'react';
import { Apple, Activity, Droplets, Moon, Brain, Coffee, HeartPulse } from 'lucide-react';

const tips = [
    // Fruit & Food health benefits
    { tip: "Apples are rich in fiber and support digestive health.", category: "Fruit", icon: Apple, proTip: "Eat them with the skin on for maximum nutrients!" },
    { tip: "Bananas contain potassium which supports healthy blood pressure.", category: "Fruit", icon: Apple },
    { tip: "Berries are packed with antioxidants that protect your cells.", category: "Fruit", icon: Apple },
    // Food nutrition tips
    { tip: "Almonds provide healthy fats and support brain health.", category: "Nutrition", icon: Coffee, proTip: "A handful a day is a great snack." },
    { tip: "Oats are a great source of soluble fiber, which can lower cholesterol.", category: "Nutrition", icon: Coffee },
    { tip: "Leafy greens like spinach are rich in iron and bone-building calcium.", category: "Nutrition", icon: Coffee },
    // Hydration reminders
    { tip: "Drink at least 2 liters of water daily to stay hydrated.", category: "Hydration", icon: Droplets, proTip: "Keep a water bottle visible at your desk." },
    { tip: "Drinking water before meals can aid digestion and prevent overeating.", category: "Hydration", icon: Droplets },
    // Exercise suggestions
    { tip: "A 20-minute walk can improve cardiovascular health.", category: "Exercise", icon: Activity, proTip: "Try a brisk walk after lunch." },
    { tip: "Regular stretching improves flexibility and prevents injury.", category: "Exercise", icon: Activity },
    { tip: "Aim for at least 150 minutes of moderate aerobic activity every week.", category: "Exercise", icon: HeartPulse },
    // Sleep improvement tips
    { tip: "Aim for 7-9 hours of quality sleep each night for optimal health.", category: "Sleep", icon: Moon, proTip: "Keep your bedroom cool and dark." },
    { tip: "Avoid screens for an hour before bed to improve sleep quality.", category: "Sleep", icon: Moon },
    // Mental wellness tips
    { tip: "Take 5 minutes daily for deep breathing exercises to reduce stress.", category: "Mental Wellness", icon: Brain, proTip: "Try the 4-7-8 breathing technique." },
    { tip: "Practicing gratitude can improve your mood and overall mental well-being.", category: "Mental Wellness", icon: Brain }
];

// 3 hours in milliseconds
const ROTATION_INTERVAL_MS = 3 * 60 * 60 * 1000;

const calculateTipIndex = () => {
    // Determine which 3-hour block we are currently in based on Unix epoch
    // This ensures consistent rotation across sessions and reloads
    const blockNumber = Math.floor(Date.now() / ROTATION_INTERVAL_MS);
    return blockNumber % tips.length;
};

export default function HealthTipCard() {
    const [currentTipIndex, setCurrentTipIndex] = useState(() => calculateTipIndex());
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Check periodically if we've crossed into a new rotation block (checks every minute)
        const interval = setInterval(() => {
            const newIndex = calculateTipIndex();
            setCurrentTipIndex((prev) => {
                if (prev !== newIndex) {
                    // Trigger CSS fade transition
                    setIsTransitioning(true);
                    setTimeout(() => setIsTransitioning(false), 500);
                    return newIndex;
                }
                return prev;
            });
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const activeTip = tips[currentTipIndex];
    const IconComponent = activeTip.icon;

    return (
        <div className="glass-card bg-gradient-to-br from-emerald-50/80 to-blue-50/50 dark:from-emerald-900/20 dark:to-blue-900/20 hover:shadow-glass-hover transition-all duration-300 relative overflow-hidden">
            {/* Decorative gradient blurs for modern aesthetics */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/20 dark:bg-emerald-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-300/20 dark:bg-blue-600/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 border-b border-emerald-100/50 dark:border-emerald-800/30 pb-3">
                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex-1">
                        Small healthy choices make a big difference
                    </h3>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 shadow-sm border border-emerald-100 dark:border-slate-700">
                        {activeTip.category}
                    </span>
                </div>

                <div className={`flex items-start gap-5 transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20 text-white transform transition-transform duration-500 hover:scale-110">
                        <IconComponent className="w-7 h-7" />
                    </div>
                    <div className="pt-1">
                        <p className="text-slate-800 dark:text-slate-100 font-medium text-lg leading-relaxed">
                            "{activeTip.tip}"
                        </p>
                        {activeTip.proTip && (
                            <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2.5 font-semibold flex items-center gap-1.5">
                                <span className="bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Pro Tip</span>
                                {activeTip.proTip}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
