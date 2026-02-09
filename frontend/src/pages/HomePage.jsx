
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Lock, FileCheck, Users, Activity, ArrowRight,
    Heart, Stethoscope, Pill, Clock, CheckCircle,
    Server, Database, Key, UserCheck, Zap, Globe, FileText,
    Moon, Menu, X, ChevronLeft, ChevronRight, Phone, Mail
} from 'lucide-react';
import PolicyModal from '../components/PolicyModal';
import TeamModal from '../components/TeamModal';
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
                    key={index}
                    style={{ transitionDelay: `${index * staggerDelay}ms` }}
                    className={`transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        }`}
                >
                    {child}
                </div>
            ))}
        </div>
    );
};

// -------------------------------------------------------------------
// COMPONENT: Feature Card
// -------------------------------------------------------------------
const FeatureCard = ({ icon: Icon, title, description, color }) => (
    <div className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${color} rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        <div className="mb-6 inline-flex p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
            <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
);

// -------------------------------------------------------------------
// PAGE: Unified Homepage (Fixed Dark Mode & Opacity)
// -------------------------------------------------------------------
const HomePage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

    // Explicit Dark Mode State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Apply Dark Mode Class to HTML Element
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

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
            color: 'from-teal-500 to-emerald-500',
        },
        {
            icon: FileCheck,
            title: 'Consent-Based Access',
            description: 'Patients control who can access their records. Doctors must request and receive explicit consent before viewing data.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Activity,
            title: 'Complete Audit Trail',
            description: 'Immutable audit logs track every data access and system action for full compliance and legal readiness.',
            color: 'from-purple-500 to-pink-500',
        },
    ];

    const slideshowImages = [
        "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=2091&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1584982751034-18872023d47a?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white relative overflow-x-hidden selection:bg-teal-500/30 transition-colors duration-500">

            {/* Global Background Slideshow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <HeroSlideshow images={slideshowImages} interval={5000} />
                {/* Overlay: Light Mode (10% White) / Dark Mode (45% Black) -> Even higher visibility */}
                <div className="absolute inset-0 bg-white/10 dark:bg-slate-950/45 transition-colors duration-500"></div>
            </div>

            {/* Floating Centered Navigation */}
            <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}>
                <div className="bg-white/20 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 rounded-full px-6 py-3 shadow-lg flex items-center justify-between">

                    {/* Brand Icon */}
                    <div className="flex items-center gap-2">
                        <Heart className="h-6 w-6 text-primary-600 dark:text-primary-500" />
                        <span className="text-lg font-bold tracking-tight hidden sm:block text-slate-900 dark:text-white">SecureCare<span className="text-primary-500">+</span></span>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
                        <a href="#security" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Security</a>
                        <a href="#contact" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact Us</a>
                        <Link to="/login" className="text-sm font-medium text-slate-900 dark:text-white hover:text-primary-600 transition-colors">Login</Link>
                    </div>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/register" className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-900 dark:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown (Floating) */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl md:hidden">
                        <a href="#features" className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-900 dark:text-white">Features</a>
                        <a href="#security" className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-900 dark:text-white">Security</a>
                        <a href="#contact" className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>Contact Us</a>
                        <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-900 dark:text-white">Login</Link>
                        <Link to="/register" className="px-4 py-2 rounded-lg bg-primary-600 text-white font-bold text-center">Get Started</Link>
                    </div>
                )}
            </nav>

            {/* Theme Toggle - Fixed Top Right (Independent) */}
            <button
                onClick={toggleTheme}
                className="fixed top-6 right-6 z-[60] p-3 rounded-full bg-white/20 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 text-slate-700 dark:text-yellow-400 hover:bg-white/40 dark:hover:bg-slate-800/60 transition-all shadow-lg hover:scale-110"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Zap className="w-5 h-5 fill-current" /> : <Moon className="w-5 h-5 fill-current" />}
            </button>

            <main className="relative z-10 pt-32 selection:bg-teal-500/30">
                {/* Hero Section */}
                <section className="px-6 py-12 md:py-20 max-w-7xl mx-auto">
                    <RevealGroup>
                        <div className="text-center max-w-4xl mx-auto space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium">
                                <Shield className="w-4 h-4" />
                                <span>HIPAA & GDPR Compliant</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                                Secure Healthcare <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-400">
                                    Information Management
                                </span>
                            </h1>

                            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                                Enterprise-grade security for your medical data.
                                Military-grade encryption, role-based access, and complete audit trails.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link to="/register" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-500/25 transition-all hover:-translate-y-1 flex items-center gap-2">
                                    Start Free Trial <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/login" className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                    Sign In
                                </Link>
                            </div>

                            <div className="pt-8 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Trusted by 10,000+ Healthcare Professionals</span>
                            </div>
                        </div>
                    </RevealGroup>

                    {/* Stats Bar */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 py-12">
                        {stats.map((stat, i) => (
                            <RevealGroup key={i} staggerDelay={100}>
                                <div className="group relative p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 cursor-default">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-teal-400 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>

                                    <div className="mb-4 inline-flex items-center justify-center p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-primary-500/30">
                                        <stat.icon className="w-8 h-8 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                                    </div>

                                    <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-teal-500 transition-all duration-300">
                                        {stat.value}
                                    </div>

                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-300">
                                        {stat.label}
                                    </div>
                                </div>
                            </RevealGroup>
                        ))}
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <RevealGroup>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Defense in Depth</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                Built from the ground up with security and compliance in mind.
                            </p>
                        </RevealGroup>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <RevealGroup key={i} staggerDelay={200}>
                                <FeatureCard {...feature} />
                            </RevealGroup>
                        ))}
                    </div>
                </section>

                {/* Abstract Visual Section */}
                <section id="security" className="py-24 bg-slate-100/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                        <RevealGroup>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                                Compliance Ready
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                Our platform helps you meet HIPAA, GDPR, and SOC 2 requirements with built-in compliance tools and automated audit logging.
                            </p>
                            <ul className="space-y-4">
                                {['Automated Hipaa Reporting', 'Real-time Threat Detection', 'Encrypted Data Storage'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </RevealGroup>
                        <div className="relative h-96 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                            {/* Abstract Secure Graphic */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-teal-500/5"></div>
                            <Shield className="w-48 h-48 text-primary-500 opacity-20 animate-pulse" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-teal-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 px-6 text-center max-w-4xl mx-auto">
                    <RevealGroup>
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Ready to Secure Your Data?</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/register" className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-lg hover:shadow-xl transition-all">
                                Get Started
                            </Link>
                        </div>
                    </RevealGroup>
                </section>
            </main>

            <footer id="contact" className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 items-start mb-16">
                        <div className="text-left">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
                                Have questions? Our team is here to help you 24/7 with any inquiries about our secure healthcare platform.
                            </p>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 group">
                                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-all">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Call Us</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">+91 70654 34128</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Email Us</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">securecare@gmail.com</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-6">
                                <Heart className="h-8 w-8 text-primary-600 dark:text-primary-500" />
                                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SecureCare<span className="text-primary-500">+</span></span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-0">
                                Empowering healthcare providers with military-grade security and seamless data management solutions.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Documentation</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <button
                                        onClick={() => setIsTeamModalOpen(true)}
                                        className="hover:text-primary-400 transition-colors text-left"
                                    >
                                        About Us
                                    </button>
                                </li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <button
                                        onClick={() => setIsPolicyModalOpen(true)}
                                        className="hover:text-primary-400 transition-colors text-left"
                                    >
                                        Privacy Policy
                                    </button>
                                </li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">HIPAA Compliance</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">GDPR</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            © 2026 SecureCare+. All rights reserved. <br />
                            GDPR & HIPAA Compliant Healthcare Platform
                        </p>
                    </div>
                </div>
            </footer>

            <PolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
            />
            <TeamModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
            />
        </div>
    );
};

export default HomePage;
