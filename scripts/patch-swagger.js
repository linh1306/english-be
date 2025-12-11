const fs = require('fs');
const path = require('path');

const swaggerPath = path.join(process.cwd(), 'swagger.json');

if (!fs.existsSync(swaggerPath)) {
    console.error('swagger.json not found');
    process.exit(1);
}

const swaggerContent = fs.readFileSync(swaggerPath, 'utf-8');
const swagger = JSON.parse(swaggerContent);

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
                // Join with underscore
                const operationId = accessor.join('_');
                operation.operationId = operationId;
            }
        }
    }
}

fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2), 'utf-8');
console.log('Swagger patched successfully with operationIds and tags.');
