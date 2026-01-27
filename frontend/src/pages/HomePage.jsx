import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileCheck, Users, Activity, ArrowRight } from 'lucide-react';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-primary-700">
                                SecureCare<span className="text-primary-500">+</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="btn-outline">
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container-medical pt-20 pb-16">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                        <Shield className="h-4 w-4 mr-2" />
                        GDPR & HIPAA Compliant
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                        Secure, Compliant, & Intelligent
                        <span className="block text-primary-700 mt-2">Healthcare</span>
                    </h1>

                    <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                        Enterprise-grade healthcare information management with <strong>GDPR-ready data privacy</strong>,
                        role-based access control, and comprehensive consent management.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link to="/register" className="btn-primary flex items-center gap-2 text-lg">
                            Get Started
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link to="/login" className="btn-secondary text-lg">
                            Sign In
                        </Link>
                    </div>

                    <p className="mt-6 text-sm text-slate-500">
                        Join healthcare professionals and patients securing medical data worldwide
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="container-medical pb-20">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="card-glass text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-700 mb-4">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">End-to-End Encryption</h3>
                        <p className="text-slate-600">
                            AES-256-GCM field-level encryption protects sensitive patient health information (PHI) at rest and in transit.
                        </p>
                    </div>

                    <div className="card-glass text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-700 mb-4">
                            <FileCheck className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Consent-Based Access</h3>
                        <p className="text-slate-600">
                            Patients control who can access their records. Doctors must request and receive explicit consent before viewing data.
                        </p>
                    </div>

                    <div className="card-glass text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-700 mb-4">
                            <Activity className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Complete Audit Trail</h3>
                        <p className="text-slate-600">
                            Immutable audit logs track every data access and system action for full compliance and legal readiness.
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-primary-700 text-white py-16">
                <div className="container-medical text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Secure Your Healthcare Data?
                    </h2>
                    <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of healthcare professionals using SecureCare+ for compliant, secure patient management.
                    </p>
                    <Link to="/register" className="btn-secondary text-lg inline-flex items-center gap-2">
                        Create Account
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-8">
                <div className="container-medical text-center">
                    <p className="text-sm">
                        © 2026 SecureCare+. All rights reserved. | GDPR & HIPAA Compliant Healthcare Platform
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
