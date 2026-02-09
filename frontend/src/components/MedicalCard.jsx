import React from 'react';
import { FileText, FlaskConical, Pill, Image, Activity, FileCheck, Calendar, User } from 'lucide-react';

const RECORD_TYPE_CONFIG = {
    LAB_RESULT: {
        icon: FlaskConical,
        label: 'Lab Result',
        iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
        iconColor: 'text-blue-600',
        badgeClass: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
    },
    PRESCRIPTION: {
        icon: Pill,
        label: 'Prescription',
        iconBg: 'bg-gradient-to-br from-purple-100 to-violet-100',
        iconColor: 'text-purple-600',
        badgeClass: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200'
    },
    DIAGNOSIS: {
        icon: FileCheck,
        label: 'Diagnosis',
        iconBg: 'bg-gradient-to-br from-red-100 to-rose-100',
        iconColor: 'text-red-600',
        badgeClass: 'bg-red-100 text-red-700 ring-1 ring-red-200'
    },
    IMAGING: {
        icon: Image,
        label: 'Imaging',
        iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        badgeClass: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
    },
    VITALS: {
        icon: Activity,
        label: 'Vitals',
        iconBg: 'bg-gradient-to-br from-green-100 to-emerald-100',
        iconColor: 'text-green-600',
        badgeClass: 'bg-green-100 text-green-700 ring-1 ring-green-200'
    },
    GENERAL: {
        icon: FileText,
        label: 'General',
        iconBg: 'bg-gradient-to-br from-slate-100 to-gray-100',
        iconColor: 'text-slate-600',
        badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
    }
};

const MedicalCard = ({ record, onClick }) => {
    const config = RECORD_TYPE_CONFIG[record.recordType] || RECORD_TYPE_CONFIG.GENERAL;
    const Icon = config.icon;

    return (
        <div
            className="card-glass-white p-5 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            onClick={() => onClick && onClick(record)}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 h-14 w-14 rounded-2xl ${config.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`h-7 w-7 ${config.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                            {record.title}
                        </h3>
                        <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${config.badgeClass}`}>
                            {config.label}
                        </span>
                    </div>

                    {/* Diagnosis */}
                    <p className="text-sm font-medium text-primary-600 mb-2">
                        {record.diagnosis}
                    </p>

                    {/* Details */}
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {record.details}
                    </p>

                    {/* Prescription */}
                    {record.prescription && (
                        <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <div className="flex items-center gap-2">
                                <Pill className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <p className="text-xs font-medium text-green-800 line-clamp-1">
                                    {record.prescription}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(record.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full">
                            <User className="w-3.5 h-3.5 text-primary-500" />
                            Dr. {record.createdBy}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalCard;
