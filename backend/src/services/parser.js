const fs = require('fs');
const yaml = require('js-yaml');

function loadSpec(filePath)
{
  //Read the file contents
  const content = fs.readFileSync(filePath, 'utf8');

  //Parse JSON
  if(filePath.endsWith('.json'))
  {
    return JSON.parse(content);
  }

  //Parse YAML
  if(
    filePath.endsWith('.yaml') ||
    filePath.endsWith('.yml')
  ){
    return yaml.load(content);
  }

  throw new Error('Unsupported file type');
}

function parseOperations(spec) {
    const operations = [];

    for (const path in spec.paths) {
        for (const method in spec.paths[path]) {

            const operation = spec.paths[path][method];

            operations.push({
                operationId: operation.operationId,
                method: method.toUpperCase(),
                path: path,
                parameters: operation.parameters || []
            });

        }
    }

    return operations;
}

function resolveRef(ref, spec) {
    const path = ref.replace('#/', '');

    const keys = path.split('/');

    let current = spec;

    for (const key of keys) {
        current = current[key];
    }

    return current;
}

module.exports = {
  loadSpec,
  parseOperations,
  resolveRef
};