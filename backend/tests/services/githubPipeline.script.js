import fs from 'fs';

import parser from '../../src/services/parser.js';
import generator from '../../src/generator.js';

const {
    loadSpec,
    parseOperations
} = parser;

const {
    generateTool,
    generateServerCode
} = generator;

const spec = loadSpec('./specs/github.json');

const operations = parseOperations(spec);

console.log(`Found ${operations.length} operations`);

const tools = operations.map(generateTool);

console.log(`Generated ${tools.length} tools`);

const code = generateServerCode(tools);

fs.writeFileSync('./generated-server.ts', code);

console.log('generated-server.ts created successfully');