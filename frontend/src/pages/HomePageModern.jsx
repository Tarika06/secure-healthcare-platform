
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Activity, ArrowRight, CheckCircle, Smartphone, Globe, FileCheck, Key, Eye } from 'lucide-react';
import HeroSlideshow from '../components/HeroSlideshow';

// -------------------------------------------------------------------
// SIGNATURE ANIMATION: Secure Heartbeat
// -------------------------------------------------------------------
const SecureHeartbeat = () => {
    return (
        <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
            {/* Outer Rings */}
            <div className="absolute inset-0 border-2 border-primary-500/30 rounded-full animate-ping-slow"></div>
            <div className="absolute inset-2 border border-primary-400/20 rounded-full animate-spin-slow-reverse"></div>
            <div className="absolute inset-6 border border-teal-500/30 rounded-full animate-spin-slow dashed-border"></div>

            {/* Core Heart */}
            <div className="relative z-10 flex items-center justify-center">
                <Shield className="w-12 h-12 md:w-20 md:h-20 text-primary-500 animate-pulse-fast drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
                <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full animate-pulse"></div>
            </div>

            {/* Data Particles */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-orbit-1"></div>
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-teal-300 rounded-full animate-orbit-2"></div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------------
// COMPONENT: Reveal on Scroll
// -------------------------------------------------------------------
const RevealSection = ({ children, className = "", direction = "up" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const directionClasses = {
        up: "translate-y-12",
        left: "-translate-x-12",
        right: "translate-x-12",
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${directionClasses[direction]}`
                } ${className}`}
        >
            {children}
        </div>
    );
};

// -------------------------------------------------------------------
// COMPONENT: Feature Card (Hover Effect)
// -------------------------------------------------------------------
const SecurityFeatureCard = ({ icon: Icon, title, description, delay }) => {
    return (
        <div
            className="group relative bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-8 overflow-hidden hover:border-primary-500/50 transition-all duration-500"
            style={{ transitionDelay: `${delay}ms` }}
        >
            {/* Scanline Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out pointer-events-none" />

            {/* Encrypted Grid Pattern Fade In */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-primary-500/20 transition-all duration-300 border border-slate-100 dark:border-slate-700">
                    <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400 group-hover:text-primary-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                    {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};

// -------------------------------------------------------------------
// PAGE: Universal Modern Homepage
// -------------------------------------------------------------------
const HomePageModern = () => {
    // Reusing the slideshow images from the main app
    const slideshowImages = [
        "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=2091&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1584982751034-18872023d47a?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-primary-500/30">
            {/* Background Slideshow Layer */}
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none mix-blend-multiply dark:mix-blend-overlay">
                <HeroSlideshow images={slideshowImages} interval={4000} />
            </div>

            {/* Navigation Overlay */}
            <nav className="fixed w-full z-50 px-6 py-4 transition-all duration-300 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">SecureCare<span className="text-primary-500">+</span></span>
                    </div>
                    <div className="flex gap-6 items-center">
                        <Link to="/login" className="text-sm font-medium hover:text-primary-600 transition-colors">Sign In</Link>
                        <Link to="/register" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                            Get Access <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section: Asymmetric Split */}
            <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-[90vh] flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-10 order-2 md:order-1">
                    <RevealSection>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-6">
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                            System Operational
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
                            Healthcare Data, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-400 dark:from-primary-400 dark:to-teal-300">
                                Fortified.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                            The enterprise standard for encrypted patient records.
                            Zero-knowledge architecture meets seamless clinical workflow.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/register" className="group px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-primary-500/30 flex items-center gap-3">
                                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Initiate Secure Trial
                            </Link>
                            <Link to="/login" className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl font-semibold transition-all flex items-center gap-3">
                                View Documentation
                            </Link>
                        </div>
                    </RevealSection>
                </div>

                <div className="flex-1 flex justify-center order-1 md:order-2">
                    <div className="relative">
                        <SecureHeartbeat />
                        {/* Decorative Blur Background behind heartbeat */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-primary-200/30 to-teal-200/30 dark:from-primary-900/20 dark:to-teal-900/20 rounded-full blur-[100px] pointer-events-none" />
                    </div>
                </div>
            </section>

            {/* Scrolling Stats Bar - "Ticker" style */}
            <div className="relative z-10 border-y border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden py-6">
                <div className="flex justify-around items-center max-w-7xl mx-auto px-6 opacity-80">
                    {[
                        { label: "Uptime", value: "99.99%" },
                        { label: "Encryption", value: "AES-256" },
                        { label: "Compliance", value: "HIPAA / GDPR" },
                        { label: "Active Nodes", value: "12,405" }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">{stat.label}</span>
                            <span className="text-lg md:text-xl font-mono font-bold text-primary-600 dark:text-primary-400">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Grid: Asymmetric & Layered */}
            <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
                <RevealSection>
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Defense in Depth</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Our security stack is designed to assume compromise and mitigate instantly.
                            Your data isn't just stored; it's defended.
                        </p>
                    </div>
                </RevealSection>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <RevealSection delay={0}>
                        <SecurityFeatureCard
                            icon={Lock}
                            title="Zero-Knowledge Vault"
                            description="Only you hold the keys. Even our engineers cannot access patient data, ensuring total privacy by design."
                            delay={0}
                        />
                    </RevealSection>
                    <RevealSection delay={100} className="lg:translate-y-12">
                        <SecurityFeatureCard
                            icon={Activity}
                            title="Real-time Threat Intel"
                            description="AI-driven monitors constantly scan for anomalous access patterns, blocking threats before they breach."
                            delay={150}
                        />
                    </RevealSection>
                    <RevealSection delay={200}>
                        <SecurityFeatureCard
                            icon={FileCheck}
                            title="Immutable Audit Trails"
                            description="Every view, edit, and export is cryptographically signed and logged on a ledger that cannot be altered."
                            delay={300}
                        />
                    </RevealSection>
                    <RevealSection delay={300}>
                        <SecurityFeatureCard
                            icon={Key}
                            title="Multi-Factor Sentinel"
                            description="Hardware-level security key support (YubiKey) and biometric authentication for all staff entries."
                            delay={450}
                        />
                    </RevealSection>
                    <RevealSection delay={400} className="lg:translate-y-12">
                        <SecurityFeatureCard
                            icon={Smartphone}
                            title="Mobile Fortification"
                            description="Secure enclaves on mobile devices ensure data is never exposed to other apps or clipboards."
                            delay={600}
                        />
                    </RevealSection>
                    <RevealSection delay={500}>
                        <SecurityFeatureCard
                            icon={Eye}
                            title="Role-Based Granularity"
                            description="Define access down to the field level. A billing clerk sees finances; a surgeon sees imaging. Nothing else."
                            delay={750}
                        />
                    </RevealSection>
                </div>
            </section>

            {/* Scroll Animation Section: The "Vault" */}
            <section className="relative z-10 py-32 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative">
                    <RevealSection direction="left">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1">
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">The Secure Vault</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                                    When data enters SecureCare+, it is fragmented, encrypted, and distributed across geographically redundant secure zones.
                                </p>
                                <ul className="space-y-4">
                                    {["256-bit AES Encryption", "Geo-redundant Backups", "Automatic Failover", "Self-Healing Integrity"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                            <CheckCircle className="w-5 h-5 text-teal-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 relative h-96 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-2xl">
                                {/* Abstract Visualization of Data Flow */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-48 h-48 bg-slate-900 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden group">
                                        <Lock className="w-16 h-16 text-slate-700" />

                                        {/* Data Streams */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent animate-pulse" />
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 shadow-[0_0_15px_#14b8a6] animate-scan-down"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealSection>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer className="relative z-10 py-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                        <Lock className="w-5 h-5" />
                        <span className="font-bold">SecureCare+</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        © 2026 SecureCare Platforms Inc.
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-slate-500">
                        <a href="#" className="hover:text-primary-500 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary-500 transition-colors">Terms</a>
                        <a href="#" className="hover:text-primary-500 transition-colors">Status</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePageModern;
