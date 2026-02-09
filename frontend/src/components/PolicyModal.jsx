import React from 'react';
import { FileText, Shield } from 'lucide-react';
import Modal from './Modal';

const PolicyItem = ({ title, description, mapping }) => (
    <div className="py-6 border-b border-slate-100 last:border-0">
        <h4 className="text-lg font-bold text-slate-800 mb-3">{title}</h4>
        <div className="space-y-2 mb-4">
            {description.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                    <span className="text-primary-500 font-bold">•</span>
                    {item}
                </div>
            ))}
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance:</span>
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                {mapping}
            </span>
        </div>
    </div>
);

const PolicyModal = ({ isOpen, onClose }) => {
    const policies = [
        {
            title: "Privacy & Data Protection Policy",
            description: [
                "Patient health data is collected only for medical care and treatment workflows.",
                "Access to medical records is restricted based on role (Patient, Doctor, Nurse, Lab).",
                "All sensitive health data is encrypted at rest and in transit.",
                "Patient data is never shared with unauthorized parties."
            ],
            mapping: "HIPAA Privacy Rule, Minimum Necessary Standard"
        },
        {
            title: "Access Control & Authorization Policy",
            description: [
                "Only authenticated hospital-issued users can access the system.",
                "Role-based access control enforces least-privilege access.",
                "Patients can only view their own records.",
                "Doctors and nurses can access patient data strictly based on clinical responsibility."
            ],
            mapping: "HIPAA Access Control & Workforce Security"
        },
        {
            title: "Audit & Monitoring Policy",
            description: [
                "All access to patient records is logged with user identity, timestamp, and action.",
                "Unauthorized access attempts are recorded and flagged.",
                "Audit logs are immutable and retained for compliance review."
            ],
            mapping: "HIPAA Audit Controls"
        },
        {
            title: "Consent Management Policy",
            description: [
                "Patients explicitly consent to data access during first login.",
                "Consent is required before sharing data across departments.",
                "Patients can view consent history and revoke consent where applicable."
            ],
            mapping: "HIPAA Authorization & Patient Rights"
        },
        {
            title: "AI & Data Analytics Policy",
            description: [
                "AI analysis is performed only on anonymized and de-identified patient data.",
                "No personally identifiable information is used in analytics.",
                "AI insights are used only for clinical support, not autonomous decisions."
            ],
            mapping: "Ethical AI + HIPAA De-identification Standard"
        }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="System Policies & Compliance Standards"
            icon={FileText}
            maxWidth="sm:max-w-4xl"
        >
            <div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                <div className="mb-6 pb-6 border-b border-slate-100">
                    <p className="text-sm text-slate-500 leading-relaxed">
                        These policies outline our commitment to protecting your health information and ensuring
                        system integrity according to HIPAA and GDPR standards.
                    </p>
                </div>

                <div className="divide-y divide-slate-50">
                    {policies.map((policy, index) => (
                        <PolicyItem key={index} {...policy} />
                    ))}
                </div>

                <div className="mt-10 mb-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-primary px-8"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PolicyModal;
