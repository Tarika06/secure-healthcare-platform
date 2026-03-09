const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
    fs.writeFileSync('lint_output.txt', 'SUCCESS:\n' + output);
} catch (e) {
    fs.writeFileSync('lint_output.txt', 'FAILED:\n' + e.stdout + '\n' + e.stderr);
}
