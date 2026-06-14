import { describe, test, expect } from 'vitest';

import parser from '../../src/services/parser.js';

const {
    loadSpec,
    parseOperations,
    resolveRef
} = parser;

const spec = loadSpec('./specs/petstore.json');

describe('parseOperations', () => {

    test('counts operations correctly', () => {

        const operations = parseOperations(spec);

        expect(operations.length).toBe(3);

    });

    test('extracts parameters correctly', () => {

        const operations = parseOperations(spec);

        const operation = operations.find(
            op => op.operationId === 'showPetById'
        );

        expect(operation.parameters.length)
            .toBe(1);

        expect(operation.parameters[0].name)
            .toBe('petId');

    });

    test('resolves a $ref correctly', () => {

        const schema = resolveRef(
            '#/components/schemas/Pet',
            spec
        );

        expect(schema.type)
            .toBe('object');

        expect(schema.properties.name.type)
            .toBe('string');

    });

});