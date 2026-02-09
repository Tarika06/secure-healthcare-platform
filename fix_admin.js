const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, 'frontend/src/pages/admin/AdminDashboard.jsx');

function fixAdmin() {
    let content = fs.readFileSync(adminPath, 'utf8');

    // Regex to match the User Table conflict block
    // Matches <<<<<<< HEAD ... ======= ... >>>>>>> origin/akilan-audit
    const regex = /<<<<<<< HEAD[\s\S]*?>>>>>>> origin\/akilan-audit/;

    if (regex.test(content)) {
        console.log('Found conflict block in AdminDashboard.jsx');

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

        content = content.replace(regex, replacement);
        fs.writeFileSync(adminPath, content, 'utf8');
        console.log('Fixed AdminDashboard.jsx');
    } else {
        console.log('Conflict block NOT found in AdminDashboard.jsx');
    }
}

fixAdmin();
