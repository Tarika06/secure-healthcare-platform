import React from 'react';
import { FileText, FlaskConical, Pill, Image, Activity, FileCheck, Calendar, User } from 'lucide-react';

const RECORD_TYPE_CONFIG = {
    LAB_RESULT: {
        icon: FlaskConical,
        label: 'Lab Result',
        iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
        badgeClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
    },
    PRESCRIPTION: {
        icon: Pill,
        label: 'Prescription',
        iconBg: 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40',
        iconColor: 'text-purple-600 dark:text-purple-400',
        badgeClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
    },
    DIAGNOSIS: {
        icon: FileCheck,
        label: 'Diagnosis',
        iconBg: 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40',
        iconColor: 'text-red-600 dark:text-red-400',
        badgeClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800'
    },
    IMAGING: {
        icon: Image,
        label: 'Imaging',
        iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40',
        iconColor: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800'
    },
    VITALS: {
        icon: Activity,
        label: 'Vitals',
        iconBg: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
        iconColor: 'text-green-600 dark:text-green-400',
        badgeClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800'
    },
    GENERAL: {
        icon: FileText,
        label: 'General',
        iconBg: 'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800',
        iconColor: 'text-slate-600 dark:text-slate-400',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
    }
};

const MedicalCard = ({ record, onClick }) => {
    const config = RECORD_TYPE_CONFIG[record.recordType] || RECORD_TYPE_CONFIG.GENERAL;
    const Icon = config.icon;

    return (
        <div
            className="card-glass-white p-5 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden !bg-white/40 dark:!bg-slate-900/40"
            onClick={() => onClick && onClick(record)}
        >

            <div className="flex items-start gap-4 relative z-10">
                {/* Icon */}
                <div className={`flex-shrink-0 h-14 w-14 rounded-2xl ${config.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`h-7 w-7 ${config.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                            {record.title}
                        </h3>
                        <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${config.badgeClass}`}>
                            {config.label}
                        </span>
                    </div>

                    {/* Diagnosis */}
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <span className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider mr-2">Diagnosis:</span>
                        {record.diagnosis}
                    </p>

                    {/* Details */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {record.details}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                            <User className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                            Dr. {record.createdBy}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalCard;
