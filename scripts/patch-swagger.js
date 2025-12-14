const fs = require('fs');
const path = require('path');

const swaggerPath = path.join(process.cwd(), 'swagger.json');

if (!fs.existsSync(swaggerPath)) {
    console.error('swagger.json not found');
    process.exit(1);
}

const swaggerContent = fs.readFileSync(swaggerPath, 'utf-8');
const swagger = JSON.parse(swaggerContent);

const isV3 = !!swagger.openapi;
const definitions = isV3
    ? (swagger.components = swagger.components || {}, swagger.components.schemas = swagger.components.schemas || {}, swagger.components.schemas)
    : (swagger.definitions = swagger.definitions || {}, swagger.definitions);
const refPrefix = isV3 ? '#/components/schemas/' : '#/definitions/';

if (swagger.paths) {
    for (const [pathKey, pathItem] of Object.entries(swagger.paths)) {
        if (typeof pathItem !== 'object' || pathItem === null) continue;

        for (const [method, operation] of Object.entries(pathItem)) {
            if (typeof operation !== 'object' || operation === null) continue;
            // Skip non-operation keys
            if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'].indexOf(method.toLowerCase()) === -1) {
                continue;
            }

            // Add Tags from x-samchon-controller
            if (operation['x-samchon-controller']) {
                let controllerName = operation['x-samchon-controller'];
                // Remove "Controller" suffix if present
                if (controllerName.endsWith('Controller')) {
                    controllerName = controllerName.substring(0, controllerName.length - 'Controller'.length);
                }

                // Add to tags if not present
                if (!operation.tags) {
                    operation.tags = [];
                }
                // Avoid duplicates
                if (!operation.tags.includes(controllerName)) {
                    operation.tags.push(controllerName);
                }
            }

            // Add OperationId from x-samchon-accessor
            if (operation['x-samchon-accessor'] && Array.isArray(operation['x-samchon-accessor'])) {
                const accessor = operation['x-samchon-accessor'];
                operation.operationId = "api_" + accessor[accessor.length - 1];
                if (accessor.length > 0) {
                    const lastElement = accessor[accessor.length - 1];
                    const baseName = lastElement.charAt(0).toUpperCase() + lastElement.slice(1);

                    // 1. Handle Request Body
                    const bodySchemaName = `Body${baseName}`;

                    // V3
                    if (operation.requestBody && operation.requestBody.content && operation.requestBody.content['application/json'] && operation.requestBody.content['application/json'].schema) {
                        const schema = operation.requestBody.content['application/json'].schema;
                        if (!schema.$ref) {
                            definitions[bodySchemaName] = schema;
                            operation.requestBody.content['application/json'].schema = {
                                $ref: `${refPrefix}${bodySchemaName}`
                            };
                        }
                    }
                    // V2
                    if (operation.parameters) {
                        const bodyParam = operation.parameters.find(p => p.in === 'body' && p.schema && !p.schema.$ref);
                        if (bodyParam) {
                            definitions[bodySchemaName] = bodyParam.schema;
                            bodyParam.schema = {
                                $ref: `${refPrefix}${bodySchemaName}`
                            };
                        }
                    }

                    // 2. Handle Responses
                    // Prioritize 200, 201
                    const successCodes = ['200', '201'];
                    const resSchemaName = `Res${baseName}`;
                    let resFound = false;

                    if (operation.responses) {
                        for (const code of successCodes) {
                            if (operation.responses[code]) {
                                const response = operation.responses[code];
                                // V3
                                if (response.content && response.content['application/json'] && response.content['application/json'].schema) {
                                    const schema = response.content['application/json'].schema;
                                    if (!schema.$ref) {
                                        definitions[resSchemaName] = schema;
                                        response.content['application/json'].schema = {
                                            $ref: `${refPrefix}${resSchemaName}`
                                        };
                                        resFound = true;
                                    }
                                }
                                // V2
                                else if (response.schema && !response.schema.$ref) {
                                    definitions[resSchemaName] = response.schema;
                                    response.schema = {
                                        $ref: `${refPrefix}${resSchemaName}`
                                    };
                                    resFound = true;
                                }
                                if (resFound) break; // Only rename one success response to Avoid overwriting
                            }
                        }
                    }
                }
            }
        }
    }
}

fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2), 'utf-8');
console.log('Swagger patched successfully with operationIds, tags, and extracted schemas.');
