const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, 'frontend/src/pages/admin/AdminDashboard.jsx');
const doctorPath = path.join(__dirname, 'frontend/src/pages/doctor/DoctorDashboard.jsx');

function fixAdmin() {
    let content = fs.readFileSync(adminPath, 'utf8');

    // Admin User Table Conflict
    // We look for the marker block
    const conflictStart = '<<<<<<< HEAD';
    const conflictMid = '=======';
    const conflictEnd = '>>>>>>> origin/akilan-audit';

    const startIndex = content.indexOf(conflictStart);
    if (startIndex !== -1) {
        const endIndex = content.indexOf(conflictEnd, startIndex);
        if (endIndex !== -1) {
            const block = content.substring(startIndex, endIndex + conflictEnd.length);

            // Replacement content (merged)
            const replacement = `                                            <tbody className="divide-y divide-slate-100">
                                                {filteredUsers.map((u, idx) => (
                                                    <tr
                                                        key={u.userId}
                                                        className="table-row-hover"
                                                        style={{ animationDelay: \`\${idx * 50}ms\` }}
                                                    >
                                                        <td className="py-4 px-4 font-mono text-sm text-primary-600">{u.userId}</td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={\`h-2.5 w-2.5 rounded-full \${u.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}\`} title={u.isOnline ? "Online" : "Offline"} />
                                                                <span className="font-medium text-slate-800">{u.firstName} {u.lastName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-slate-500">{u.email}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={\`px-3 py-1.5 rounded-full text-xs font-semibold \${getRoleBadgeColor(u.role)}\`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={\`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold \${u.status === 'ACTIVE'
                                                                ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                                                                : 'bg-red-100 text-red-700 ring-1 ring-red-200'
                                                                }\`}>
                                                                {u.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                                {u.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>`;

            // Only replace if it looks like the User Table conflict (check for some content)
            if (block.includes('filteredUsers.map')) {
                content = content.replace(block, replacement);
                console.log('Fixed AdminDashboard Users Table');
            }
        }
    }

    fs.writeFileSync(adminPath, content, 'utf8');
}

function fixDoctor() {
    let content = fs.readFileSync(doctorPath, 'utf8');

    // Doctor My Records Conflict
    const conflictStart = '<<<<<<< HEAD';
    const conflictEnd = '>>>>>>> origin/akilan-audit';

    const startIndex = content.indexOf(conflictStart);
    if (startIndex !== -1) {
        const endIndex = content.indexOf(conflictEnd, startIndex);
        if (endIndex !== -1) {
            const block = content.substring(startIndex, endIndex + conflictEnd.length);

            // Replacement content (merged)
            const replacement = `                                    {myCreatedRecords.map((record, idx) => (
                                        <div
                                            key={record._id}
                                            className="card hover:shadow-xl transition-all duration-300"
                                            style={{ animationDelay: \`\${idx * 100}ms\` }}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={\`px-3 py-1.5 rounded-full text-xs font-semibold \${record.recordType === 'PRESCRIPTION' ? 'bg-purple-100 text-purple-700' : record.recordType === 'LAB_RESULT' ? 'bg-blue-100 text-blue-700' : record.recordType === 'DIAGNOSIS' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}\`}>
                                                        {record.recordType}
                                                    </span>
                                                    <span className="px-2 py-0.5 text-[8px] rounded bg-red-50 text-red-600 border border-red-100 font-bold uppercase tracking-tighter">HIPAA</span>
                                                    <span className="text-sm text-slate-400 flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(record.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1">{record.title}</h3>
                                            <p className="text-sm text-slate-500 mb-3">Patient: {record.patientName}</p>
                                            <div className="space-y-2">
                                                <p className="text-slate-700"><strong className="text-slate-900">Diagnosis:</strong> {record.diagnosis}</p>
                                                <p className="text-slate-600 text-sm">{record.details}</p>
                                                {record.prescription && (
                                                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                                        <p className="text-green-800 text-sm"><strong>Rx:</strong> {record.prescription}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}`;

            if (block.includes('myCreatedRecords.map')) {
                content = content.replace(block, replacement);
                console.log('Fixed DoctorDashboard My Records');
            }
        }
    }

    fs.writeFileSync(doctorPath, content, 'utf8');
}

fixAdmin();
fixDoctor();
