import React from 'react';
import { User, Shield, Activity, Phone, Mail, Stethoscope, Star } from 'lucide-react';

const IdentityCard = ({ user }) => {
    if (!user) return null;

    // Determine role-specific labels and icons
    let tile1Label = 'ROLE';
    let tile1Value = user.role;
    let tile2Label = 'USER ID';
    let tile2Value = user.userId;

    if (user.role === 'PATIENT') {
        tile1Label = 'BLOOD TYPE';
        tile1Value = 'O-Positive'; // Placeholder for mockup style
        tile2Label = 'HEIGHT';
        tile2Value = '182 cm'; // Placeholder for mockup style
    } else if (user.role === 'DOCTOR') {
        tile1Label = 'SPECIALTY';
        tile1Value = user.specialty || 'General Practice';
        tile2Label = 'STATUS';
        tile2Value = user.status || 'Active';
    } else if (user.role === 'NURSE') {
        tile1Label = 'SHIFT';
        tile1Value = 'Morning / Day';
        tile2Label = 'STATUS';
        tile2Value = user.status || 'Active';
    }

    // Colors mapping from the screenshot
    // Background: #094b46
    // Inner boxes: #145b54
    // Avatar text: white
    // Avatar bg: #1c6d66

    return (
        <div className="bg-[#094b46] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 shadow-xl relative overflow-hidden group w-full mb-8 animate-fade-in transition-all duration-700">
            {/* Decorative Orbs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl group-hover:bg-teal-400/20 transition-all duration-700" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700" />

            {/* Left/Top Section: Avatar & Name */}
            <div className="flex-1 flex items-center gap-5 relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] bg-[#1c6d66] flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-inner flex-shrink-0">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                        {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-[#8be1d6] font-medium flex items-center gap-1.5 mt-1 truncate">
                        {user.email || 'patient1@hospital.com'}
                    </p>
                </div>
            </div>

            {/* Right/Bottom Section: Tiles */}
            <div className="flex flex-row gap-4 w-full md:w-auto mt-4 md:mt-0 relative z-10">
                <div className="bg-[#145b54] p-4 sm:p-5 rounded-2xl flex-1 md:w-40 flex flex-col justify-center border border-teal-700/30">
                    <p className="text-[10px] sm:text-xs uppercase font-bold text-[#8be1d6] tracking-wider mb-1.5">
                        {tile1Label}
                    </p>
                    <p className="text-lg sm:text-lg font-bold text-white break-words leading-tight">
                        {tile1Value}
                    </p>
                </div>
                <div className="bg-[#145b54] p-4 sm:p-5 rounded-2xl flex-1 md:w-40 flex flex-col justify-center border border-teal-700/30">
                    <p className="text-[10px] sm:text-xs uppercase font-bold text-[#8be1d6] tracking-wider mb-1.5">
                        {tile2Label}
                    </p>
                    <p className="text-lg sm:text-lg font-bold text-white break-words leading-tight">
                        {tile2Value}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IdentityCard;
