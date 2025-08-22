import { PUT_TDS } from "@/consts/xds";
import SwaggerParser from "swagger-parser";
import { toPrettyJsonString } from "./json";

export type JsonSchema = {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
};

export type InputSchemaItem = {
    id: number;
    url: string;
    method: string;
    inputSchema?: object;
    description?: string;
};

/**
 * Merge parameters by their 'in' value to separate schemas for path and query
 */
function mergeParametersByLocation(parameters: any[] = []) {
    const pathParams = parameters.filter((p) => p.in === "path");
    const queryParams = parameters.filter((p) => p.in === "query");

    function buildSchema(params: any[]) {
        if (params.length === 0) return undefined;

        const properties: Record<string, any> = {};
        const required: string[] = [];

        params.forEach((param) => {
            if (!param.name || !param.schema) return;
            properties[param.name] = param.schema;
            if (param.required) required.push(param.name);
        });

        const schema: JsonSchema = {
            type: "object",
            properties,
        };

        if (required.length > 0) {
            schema.required = required;
        }
        return schema;
    }

    return {
        path: buildSchema(pathParams),
        query: buildSchema(queryParams),
    };
}

/**
 * Extract the request body schema from the operation,
 * supporting both OpenAPI 3 and Swagger 2 specifications
 */
function extractRequestBodySchema(
    operation: any,
    isOpenAPI3: boolean
): object | undefined {
    if (isOpenAPI3) {
        return operation?.requestBody?.content?.["application/json"]?.schema;
    } else {
        const bodyParam = operation?.parameters?.find(
            (p: any) => p.in === "body" && p.schema
        );
        return bodyParam?.schema;
    }
}

/**
 * Combine path, query, and body schemas into one object schema,
 * keeping them separate under respective properties
 */
function combineSchemas(
    paramsSchemas: { path?: JsonSchema; query?: JsonSchema },
    bodySchema?: object
): JsonSchema | undefined {
    const properties: Record<string, any> = {};
    const requiredGroups: Record<string, string[]> = {};

    if (paramsSchemas.path) {
        properties.path = paramsSchemas.path;
        if (
            paramsSchemas.path.required &&
            paramsSchemas.path.required.length > 0
        ) {
            requiredGroups.path = paramsSchemas.path.required;
        }
    }

    if (paramsSchemas.query) {
        properties.query = paramsSchemas.query;
        if (
            paramsSchemas.query.required &&
            paramsSchemas.query.required.length > 0
        ) {
            requiredGroups.query = paramsSchemas.query.required;
        }
    }

    if (bodySchema) {
        properties.body = bodySchema;
        if (
            typeof bodySchema === "object" &&
            "required" in bodySchema &&
            Array.isArray((bodySchema as any).required) &&
            (bodySchema as any).required.length > 0
        ) {
            requiredGroups.body = (bodySchema as any).required;
        }
    }

    if (Object.keys(properties).length === 0) {
        return undefined;
    }

    const combinedSchema: JsonSchema = {
        type: "object",
        properties,
    };

    // NOTE: 'required' here is customized to keep required fields per group
    // This is NOT standard JSON Schema but convenient for your usage.
    if (Object.keys(requiredGroups).length > 0) {
        (combinedSchema as any).required = requiredGroups;
    }

    return combinedSchema;
}

/**
 * Parse a Swagger/OpenAPI JSON string and extract
 * input schemas for all API paths and methods, separating path/query/body params
 */
export const parseInputSchemas = async (
    jsonString: string | ArrayBuffer | null
): Promise<InputSchemaItem[]> => {
    if (!jsonString || typeof jsonString !== "string") {
        throw new Error("Invalid JSON string");
    }

    const swaggerJson = JSON.parse(jsonString);
    const deref = await (SwaggerParser as any).dereference(swaggerJson);
    const paths = deref.paths as Record<string, Record<string, any>>;
    const isOpenAPI3 = Boolean(deref.openapi);

    const result: InputSchemaItem[] = [];

    let index = 0;

    for (const [url, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
            const paramsSchemas = mergeParametersByLocation(
                operation.parameters ?? []
            );
            const bodySchema = extractRequestBodySchema(operation, isOpenAPI3);
            const inputSchema = combineSchemas(paramsSchemas, bodySchema);

            result.push({
                id: index++,
                url,
                method: method.toUpperCase(),
                inputSchema,
                description: operation.summary || operation.description || "",
            });
        }
    }

    return result;
};

export const buildTdsFromInput = (input: InputSchemaItem) => {
    const clonedTemplate = JSON.parse(JSON.stringify(PUT_TDS));

    const { id, url, method, description, inputSchema = {} } = input;

    const requiredParams =
        typeof inputSchema === "object" &&
        "required" in inputSchema &&
        typeof (inputSchema as any).required === "object"
            ? (inputSchema as any).required
            : {};

    const res = {
        ...clonedTemplate,
        description: description ?? clonedTemplate.description,
        input_schema: inputSchema,
        tds_ext_info: {
            ...clonedTemplate.tds_ext_info,
            path: url,
            method,
            required_params: requiredParams,
        },
    };

    return toPrettyJsonString(res);
};
