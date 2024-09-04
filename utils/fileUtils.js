const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

class JavaScriptProcessor {
    
    // Method to intelligently chunk JavaScript code based on syntax and context
    intelligentChunking(code) {
        const ast = parse(code, { sourceType: 'module' });
        const chunks = [];

        // Traverse the AST to identify relevant chunks
        this.traverseAst(ast, node => {
            if (this.isRelevantNode(node)) {
                const chunk = code.slice(node.start, node.end);
                chunks.push(this.addContextToChunk(chunk, code));
            }
        });

        return chunks;
    }

    // Method to traverse the AST
    traverseAst(ast, callback) {
        if (Array.isArray(ast)) {
            ast.forEach(node => this.traverseAst(node, callback));
        } else if (ast && typeof ast.type === 'string') {
            callback(ast);
            Object.keys(ast).forEach(key => {
                if (ast[key] && typeof ast[key] === 'object') {
                    this.traverseAst(ast[key], callback);
                }
            });
        }
    }

    // Method to check if a node is relevant for chunking
    isRelevantNode(node) {
        return ['FunctionDeclaration', 'ClassDeclaration', 'ImportDeclaration'].includes(node.type);
    }

    // Method to add necessary context like imports and class definitions to the chunk
    addContextToChunk(chunk, code) {
        const imports = this.extractImports(code);
        if (imports) {
            chunk = imports + '\n' + chunk;
        }
        return chunk;
    }

    // Method to extract import statements from the code
    extractImports(code) {
        const importRegex = /import[^;]+;/g;
        return code.match(importRegex)?.join('\n') || '';
    }

    // Method to process JavaScript files
    getJsFiles(dir, files_ = []) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const name = path.join(dir, file);
            if (fs.statSync(name).isDirectory()) {
                this.getJsFiles(name, files_);
            } else if (name.endsWith('.js')) {
                files_.push(name);
            }
        }
        return files_;
    }

    splitJavaScript(fileContent) {
        return this.intelligentChunking(fileContent);
    }
}

module.exports = JavaScriptProcessor;