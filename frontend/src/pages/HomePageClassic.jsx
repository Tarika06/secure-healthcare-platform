import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Lock, FileCheck, Users, Activity, ArrowRight,
    Heart, Stethoscope, Pill, CheckCircle,
    Server, Key, UserCheck, Zap, Globe, Moon
} from 'lucide-react';
import HeroSlideshow from '../components/HeroSlideshow';

// Floating Icons Component
const FloatingIcons = () => {
    const icons = [
        { Icon: Heart, style: { top: '10%', left: '5%', animationDelay: '0s' } },
        { Icon: Shield, style: { top: '20%', right: '10%', animationDelay: '1s' } },
        { Icon: Pill, style: { top: '60%', left: '8%', animationDelay: '2s' } },
        { Icon: Stethoscope, style: { top: '75%', right: '5%', animationDelay: '0.5s' } },
        { Icon: Activity, style: { top: '40%', left: '3%', animationDelay: '1.5s' } },
        { Icon: Lock, style: { top: '85%', left: '15%', animationDelay: '2.5s' } },
        { Icon: Heart, style: { top: '30%', right: '3%', animationDelay: '3s' } },
        { Icon: FileCheck, style: { top: '50%', right: '8%', animationDelay: '1.2s' } },
    ];

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {icons.map((item, index) => (
                <div
                    key={index}
                    className="floating-icon"
                    style={{
                        ...item.style,
                        animation: `float-animation 6s ease-in-out infinite`,
                        animationDelay: item.style.animationDelay,
                    }}
                >
                    <item.Icon className="w-12 h-12 md:w-16 md:h-16" />
                </div>
            ))}
        </div>
    );
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        let startTime;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, end, duration]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );
        const element = document.getElementById(`counter-${end}`);
        if (element) observer.observe(element);
        return () => observer.disconnect();
    }, [end]);

    return (
        <span id={`counter-${end}`}>
            {count.toLocaleString()}{suffix}
        </span>
    );
};

const HomePageClassic = () => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const stats = [
        { value: 99.9, suffix: '%', label: 'Uptime Guaranteed', icon: Server },
        { value: 10000, suffix: '+', label: 'Healthcare Professionals', icon: Users },
        { value: 256, suffix: '-bit', label: 'Military-Grade Encryption', icon: Key },
        { value: 100, suffix: '%', label: 'HIPAA Compliant', icon: Shield },
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

    const steps = [
        { icon: UserCheck, title: 'Create Account', description: 'Sign up as a patient or healthcare provider with secure verification.' },
        { icon: Lock, title: 'Secure Your Data', description: 'Your medical records are encrypted and protected with role-based access.' },
        { icon: Zap, title: 'Access Anywhere', description: 'View and manage health information securely from any device.' },
    ];


    const trustBadges = [
        { icon: Shield, label: 'HIPAA Certified' },
        { icon: Globe, label: 'GDPR Compliant' },
        { icon: Lock, label: 'SOC 2 Type II' },
        { icon: CheckCircle, label: 'ISO 27001' },
    ];

    // Placeholder images for slideshow - Please replace these URLs with your actual image paths
    const slideshowImages = [
        "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=2091&ixlib=rb-4.0.3", // Medical team
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3", // Lab/Tech
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3", // Hospital corridor
        "https://images.unsplash.com/photo-1584982751034-18872023d47a?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3", // Doctor with tablet
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 relative overflow-hidden">
            {/* Dark Mode Toggle */}
            <input type="checkbox" id="theme-toggle" className="theme-toggle-checkbox" />

            <label htmlFor="theme-toggle" className="theme-toggle-btn" title="Toggle Dark Mode">
                <Moon className="w-6 h-6" />
            </label>

            <div className="curtain" />

            {/* Floating Background Icons */}
            <FloatingIcons />

            {/* Animated Gradient Overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)',
                }}
            />

            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300"
                style={{
                    boxShadow: scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
                }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Heart className="h-8 w-8 text-primary-600" />
                                <div className="absolute inset-0 animate-ping-slow">
                                    <Heart className="h-8 w-8 text-primary-400 opacity-50" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-primary-700">
                                SecureCare<span className="text-primary-500">+</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="btn-outline">
                                Login
                            </Link>
                            <Link to="/register" className="btn-glow flex items-center gap-2">
                                Get Started
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section relative z-10 pt-16 pb-24 overflow-hidden">
                {/* Slideshow Background */}
                <HeroSlideshow images={slideshowImages} interval={3500} />

                <div className="container-medical relative z-20">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6 animate-fade-in">
                            <Shield className="h-4 w-4 mr-2" />
                            GDPR & HIPAA Compliant Healthcare Platform
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight animate-slide-up drop-shadow-lg">
                            Secure, Compliant, &
                            <span className="block bg-gradient-to-r from-primary-600 via-primary-500 to-teal-400 bg-clip-text text-transparent mt-2 drop-shadow-none">
                                Intelligent Healthcare
                            </span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto animate-slide-up font-medium drop-shadow-md" style={{ animationDelay: '0.1s' }}>
                            Enterprise-grade healthcare information management with
                            <strong className="text-primary-700"> military-grade encryption</strong>,
                            role-based access control, and comprehensive consent management.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <Link to="/register" className="btn-glow flex items-center gap-2 text-lg px-8 py-4">
                                Start Free Trial
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                                Sign In
                            </Link>
                        </div>

                        {/* Trust Text */}
                        <p className="mt-8 text-sm text-slate-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
                            Trusted by 10,000+ healthcare professionals worldwide
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-10 py-12 bg-gradient-to-r from-primary-700 via-primary-600 to-teal-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center text-white">
                                <stat.icon className="h-8 w-8 mx-auto mb-2 opacity-80" />
                                <div className="text-3xl md:text-4xl font-bold">
                                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="text-sm md:text-base text-primary-100 mt-1">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-24 bg-white">
                <div className="container-medical">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Enterprise Security Features
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Built from the ground up with security and compliance in mind
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="card-glass-hover group cursor-pointer"
                            >
                                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-700 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 py-24 bg-gradient-to-b from-slate-50 to-white">
                <div className="container-medical">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Get started in three simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connection Line */}
                        <div className="hidden md:block absolute top-20 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300" />

                        {steps.map((step, index) => (
                            <div key={index} className="relative text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center shadow-xl">
                                        <step.icon className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center font-bold text-primary-700">
                                        {index + 1}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-slate-600">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Trust Badges Section */}
            <section className="relative z-10 py-16 bg-slate-900">
                <div className="container-medical">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Compliance & Certifications
                        </h2>
                        <p className="text-slate-400">
                            Meeting the highest standards in healthcare data security
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8">
                        {trustBadges.map((badge, index) => (
                            <div key={index} className="flex items-center gap-3 bg-slate-800 px-6 py-4 rounded-xl border border-slate-700 hover:border-primary-500 transition-colors">
                                <badge.icon className="h-8 w-8 text-primary-400" />
                                <span className="text-white font-medium">{badge.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-24 animated-gradient-bg overflow-hidden">
                {/* Floating Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float" />
                    <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-float-delayed" />
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-float-slow" />
                </div>

                <div className="container-medical text-center relative">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Secure Your Healthcare Data?
                    </h2>
                    <p className="text-primary-100 text-xl mb-10 max-w-2xl mx-auto">
                        Join thousands of healthcare professionals using SecureCare+ for compliant, secure patient management.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="bg-white text-primary-700 hover:bg-slate-100 font-semibold py-4 px-8 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center gap-2 text-lg">
                            Start Free Trial
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link to="/login" className="border-2 border-white text-white hover:bg-white/10 font-semibold py-4 px-8 rounded-lg transition-all duration-300 text-lg">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Wave Separator */}
            <div className="wave-separator bg-primary-700">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="fill-slate-900">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
                </svg>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="h-8 w-8 text-primary-400" />
                                <span className="text-xl font-bold text-white">SecureCare+</span>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Enterprise-grade healthcare information management with military-grade security.
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
                                <li><a href="#" className="hover:text-primary-400 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">HIPAA Compliance</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">GDPR</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-slate-800 pt-8 text-center text-sm">
                        <p>
                            © 2026 SecureCare+. All rights reserved. | GDPR & HIPAA Compliant Healthcare Platform
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePageClassic;
