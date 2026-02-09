
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Lock, FileCheck, Users, Activity, ArrowRight,
    Heart, Stethoscope, Pill, CheckCircle,
    Server, Key, UserCheck, Zap, Globe, Moon, Menu, X,
    Linkedin, Github, Twitter
} from 'lucide-react';
import HeroSlideshow from '../components/HeroSlideshow';

// -------------------------------------------------------------------
// UTILITY: Reveal on Scroll
// -------------------------------------------------------------------
const RevealGroup = ({ children, className = "", staggerDelay = 100 }) => {
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
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={className}>
            {React.Children.map(children, (child, index) => (
                <div
                    style={{ transitionDelay: `${index * staggerDelay}ms` }}
                    className={`transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                        }`}
                >
                    {child}
                </div>
            ))}
        </div>
    );
};

// -------------------------------------------------------------------
// COMPONENT: Cyberpunk/Tech Decorative Lines (The "Chaos" from the image)
// -------------------------------------------------------------------
const TechLines = () => (
    <svg className="absolute top-0 right-0 w-3/4 h-full pointer-events-none opacity-20 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <path d="M400,300 Q500,100 600,300 T800,300" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-500 animate-pulse-fast" />
        <circle cx="600" cy="300" r="10" className="text-teal-400 fill-current animate-ping" />
        <path d="M300,500 Q400,700 600,500 T900,500" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500 animate-pulse" style={{ animationDelay: '1s' }} />
        <circle cx="600" cy="500" r="5" className="text-primary-600 fill-current" />
        <path d="M500,400 L700,600" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-slate-400" />
    </svg>
);

// -------------------------------------------------------------------
// PAGE: Sidebar Layout Redesign
// -------------------------------------------------------------------
const HomePageRedesign = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Original Content Data
    const stats = [
        { value: '99.9%', label: 'Uptime', icon: Server },
        { value: '10k+', label: 'Professionals', icon: Users },
        { value: '256-bit', label: 'Encryption', icon: Key },
        { value: '100%', label: 'Compliant', icon: Shield },
    ];

    const features = [
        {
            icon: Lock,
            title: 'End-to-End Encryption',
            description: 'AES-256-GCM field-level encryption protects sensitive patient health information (PHI) at rest and in transit.',
            color: 'border-l-4 border-teal-500',
        },
        {
            icon: FileCheck,
            title: 'Consent-Based Access',
            description: 'Patients control who can access their records. Doctors must request and receive explicit consent before viewing data.',
            color: 'border-l-4 border-blue-500',
        },
        {
            icon: Activity,
            title: 'Complete Audit Trail',
            description: 'Immutable audit logs track every data access and system action for full compliance and legal readiness.',
            color: 'border-l-4 border-purple-500',
        },
    ];

    const slideshowImages = [
        "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=2091&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1584982751034-18872023d47a?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
    ];

    return (
        <div className="flex min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white overflow-x-hidden selection:bg-primary-500/30">

            {/* FIXED LEFT SIDEBAR (Desktop) */}
            <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-50 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 p-8 justify-between transition-all duration-300">
                {/* Brand */}
                <div>
                    <div className="flex items-center gap-2 mb-12">
                        <Heart className="h-8 w-8 text-primary-600 dark:text-primary-500" />
                        <span className="text-xl font-bold tracking-tighter">SecureCare<span className="text-primary-500">+</span></span>
                    </div>

                    {/* Nav Links */}
                    <nav className="space-y-6">
                        {['Features', 'Security', 'Pricing', 'Docs', 'About'].map((item) => (
                            <a key={item} href="#" className="block text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:translate-x-2 transition-all duration-300 uppercase tracking-widest">
                                {item}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <Linkedin className="w-5 h-5 text-slate-400 hover:text-primary-500 cursor-pointer transition-colors" />
                        <Github className="w-5 h-5 text-slate-400 hover:text-primary-500 cursor-pointer transition-colors" />
                        <Twitter className="w-5 h-5 text-slate-400 hover:text-primary-500 cursor-pointer transition-colors" />
                    </div>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <div className="lg:hidden fixed w-full top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Heart className="h-6 w-6 text-primary-600 dark:text-primary-500" />
                    <span className="font-bold">SecureCare+</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 lg:ml-64 relative">
                {/* Dark Mode Toggle (Preserved Logic - Floating Top Right) */}
                <div className="fixed top-6 right-6 z-[60]">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="theme-toggle" className="theme-toggle-checkbox hidden" />
                        <label htmlFor="theme-toggle" className="p-3 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg border border-slate-300 dark:border-slate-700 block">
                            <Moon className="w-5 h-5 text-slate-700 dark:text-yellow-400 fill-current" />
                        </label>
                    </div>
                </div>

                {/* Background Slideshow (Fixed to Main Area) */}
                <div className="fixed inset-0 lg:left-64 z-0 pointer-events-none">
                    <HeroSlideshow images={slideshowImages} interval={3500} />
                    {/* Overlay to ensure text readability */}
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-grayscale-[20%] transition-colors duration-500" />
                </div>

                <div className="relative z-10 px-6 lg:px-16 py-12 lg:py-24 max-w-7xl mx-auto space-y-32">

                    {/* HERO SECTION - Typography Focused (Like "Hi, Im Jack") */}
                    <section className="min-h-[80vh] flex flex-col justify-center relative">
                        <TechLines />

                        <RevealGroup>
                            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-sm text-xs font-mono tracking-widest uppercase">
                                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                                System Operational
                            </div>

                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-8 text-slate-900 dark:text-white">
                                SECURE.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-400 dark:from-primary-400 dark:to-teal-300">
                                    COMPLIANT.
                                </span><br />
                                HEALTH.
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-light mb-12 border-l-2 border-primary-500 pl-6">
                                Enterprise-grade healthcare information management with military-grade encryption, role-based access control, and comprehensive consent management.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link to="/register" className="group px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold tracking-wider hover:bg-primary-600 dark:hover:bg-primary-400 transition-all shadow-xl hover:shadow-2xl flex items-center gap-3">
                                    START FREE TRIAL
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/login" className="px-8 py-4 border border-slate-300 dark:border-slate-700 font-bold tracking-wider hover:border-slate-900 dark:hover:border-white transition-colors">
                                    SIGN IN
                                </Link>
                            </div>
                        </RevealGroup>
                    </section>

                    {/* STATS STRIP -- Minimalist */}
                    <section>
                        <RevealGroup staggerDelay={100} className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className="border-t border-slate-300 dark:border-slate-800 pt-6">
                                    <stat.icon className="w-6 h-6 text-primary-500 mb-2" />
                                    <h3 className="text-4xl font-bold font-mono my-2">{stat.value}</h3>
                                    <p className="text-sm text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </RevealGroup>
                    </section>

                    {/* FEATURES - Asymmetric Cards */}
                    <section className="relative">
                        <div className="flex flex-col lg:flex-row gap-16 items-start">
                            <div className="lg:w-1/3 sticky top-32">
                                <h2 className="text-5xl font-black mb-6 leading-none">DEFENSE<br />IN DEPTH</h2>
                                <p className="text-lg text-slate-600 dark:text-slate-400">
                                    Built from the ground up with security and compliance in mind. Your data is defended, not just stored.
                                </p>
                            </div>

                            <div className="lg:w-2/3 space-y-8">
                                {features.map((feature, i) => (
                                    <RevealGroup key={i}>
                                        <div className={`bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-primary-500/30 transition-all duration-500 group relative overflow-hidden ${feature.color}`}>
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <feature.icon className="w-32 h-32 text-primary-500 transform rotate-12" />
                                            </div>
                                            <div className="relative z-10">
                                                <feature.icon className="w-10 h-10 text-primary-600 dark:text-primary-400 mb-6" />
                                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                                            </div>
                                        </div>
                                    </RevealGroup>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA BLOCK */}
                    <section className="pb-32">
                        <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-12 lg:p-24 relative overflow-hidden isolate">
                            {/* Decorative Circle */}
                            <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl opacity-20 dark:opacity-10 mix-blend-screen pointer-events-none" />

                            <RevealGroup>
                                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                                    READY TO SECURE<br />YOUR DATA?
                                </h2>
                                <p className="text-xl opacity-80 mb-12 max-w-xl">
                                    Join thousands of healthcare professionals using SecureCare+ for compliant, secure patient management.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Link to="/register" className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors">
                                        START FREE TRIAL
                                    </Link>
                                    <Link to="/login" className="px-8 py-4 border border-white/20 dark:border-slate-900/20 hover:border-white dark:hover:border-slate-900 transition-colors font-bold">
                                        SIGN IN
                                    </Link>
                                </div>
                            </RevealGroup>
                        </div>
                    </section>
                </div>

                {/* Footer (Minimal, inline with main content) */}
                <footer className="px-6 lg:px-16 py-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-950 relative z-20">
                    <p>© 2026 SecureCare+. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-primary-500 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary-500 transition-colors">Terms</a>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default HomePageRedesign;
