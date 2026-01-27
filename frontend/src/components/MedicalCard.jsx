import React from 'react';
import { FileText, FlaskConical, Pill, Image, Activity, FileCheck } from 'lucide-react';

const RECORD_TYPE_CONFIG = {
    LAB_RESULT: {
        icon: FlaskConical,
        label: 'Lab Result',
        badgeClass: 'badge badge-lab'
    },
    PRESCRIPTION: {
        icon: Pill,
        label: 'Prescription',
        badgeClass: 'badge badge-prescription'
    },
    DIAGNOSIS: {
        icon: FileCheck,
        label: 'Diagnosis',
        badgeClass: 'badge badge-diagnosis'
    },
    IMAGING: {
        icon: Image,
        label: 'Imaging',
        badgeClass: 'badge badge-imaging'
    },
    VITALS: {
        icon: Activity,
        label: 'Vitals',
        badgeClass: 'badge badge-vitals'
    },
    GENERAL: {
        icon: FileText,
        label: 'General',
        badgeClass: 'badge badge-general'
    }
};

const MedicalCard = ({ record, onClick }) => {
    const config = RECORD_TYPE_CONFIG[record.recordType] || RECORD_TYPE_CONFIG.GENERAL;
    const Icon = config.icon;

    return (
        <div
            className="card-medical cursor-pointer group"
            onClick={() => onClick && onClick(record)}
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                        <Icon className="h-6 w-6 text-primary-700" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {record.title}
                        </h3>
                        <span className={config.badgeClass}>
                            {config.label}
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600 font-medium">
                        {record.diagnosis}
                    </p>

                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                        {record.details}
                    </p>

                    {record.prescription && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                            <p className="text-xs font-medium text-green-800">
                                Prescription: {record.prescription}
                            </p>
                        </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            {new Date(record.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                        <span className="text-xs text-primary-600 font-medium">
                            Dr. {record.createdBy}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalCard;
