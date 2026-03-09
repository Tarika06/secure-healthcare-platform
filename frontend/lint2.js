const { ESLint } = require("eslint");
const fs = require('fs');

(async function main() {
    try {
        const eslint = new ESLint();
        const results = await eslint.lintFiles(["src/**/*.{js,jsx}"]);
        const formatter = await eslint.loadFormatter("stylish");
        const resultText = formatter.format(results) || "No lint errors";
        fs.writeFileSync('lint_output2.txt', resultText);
    } catch (error) {
        fs.writeFileSync('lint_output2.txt', "Error running eslint: " + error.toString());
    }
})();
