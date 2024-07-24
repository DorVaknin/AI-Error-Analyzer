const fs = require('fs-extra');

function splitJavaScript(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const functions = content.match(/function\s+\w+\s*\(.*?\)\s*{[^]*?}/g) || [];
    return functions;
}

module.exports = splitJavaScript;
