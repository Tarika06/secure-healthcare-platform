import React from 'react';
import { Users, User, CreditCard } from 'lucide-react';
import Modal from './Modal';

const TeamMember = ({ name, id }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 transition-all group">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold group-hover:bg-primary-600 group-hover:text-white transition-colors">
                {name.charAt(0)}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{id}</p>
            </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <CreditCard className="h-3 w-3" />
            Student ID
        </div>
    </div>
);

const TeamModal = ({ isOpen, onClose }) => {
    const teamMembers = [
        { name: "Akilan C", id: "CB.SC.U4CSE23607" },
        { name: "M.Tarika", id: "CB.SC.U4CSE23629" },
        { name: "Naren Moorthy", id: "CB.SC.U4CSE23637" },
        { name: "Gheethi P U", id: "CB.SC.U4CSE23638" },
        { name: "Ranga Arun", id: "CB.SC.U4CSE23646" }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="The SecureCare+ Deployment Team"
            icon={Users}
            maxWidth="sm:max-w-xl"
        >
            <div className="space-y-4">
                <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl">
                    <p className="text-sm text-primary-800 leading-relaxed font-medium">
                        SecureCare+ is a specialized healthcare deployment platform developed with a focus on
                        cryptographic data protection and regulatory compliance.
                    </p>
                </div>

                <div className="grid gap-3">
                    {teamMembers.map((member, index) => (
                        <TeamMember key={index} {...member} />
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-primary px-8"
                    >
                        Close Registry
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TeamModal;
