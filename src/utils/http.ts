import { extend, RequestOptionsInit } from "umi-request";

export interface HttpResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

export type RequestOptions = {
    params?: Record<string, any>;
    data?: Record<string, any>;
    headers?: Record<string, string>;
};

const request = extend({
    timeout: 3 * 1000,
    credentials: "include",
    headers: {
        "Content-Type": "application/json",
    },
    errorHandler: (error: any) => {
        if (error?.response) {
            console.error(
                `[HTTP Error] ${error.response.status}: ${error.message}`
            );
        } else if (error?.message) {
            console.error(`[Request Error]: ${error.message}`);
        } else {
            console.error(`[Unknown Error]:`, error);
        }
        throw error;
    },
});

request.interceptors.request.use((url: string, options: RequestOptionsInit) => {
    const token = localStorage.getItem("token");
    return {
        url,
        options: {
            ...options,
            headers: {
                ...options.headers,
                Authorization: token ? `Bearer ${token}` : "",
            },
        },
    };
});

request.interceptors.response.use(async (response: Response) => {
    const res = await response.clone().json();
    if (res.code !== 0) {
        console.warn(`API Error [${res.code}]: ${res.message}`);
    }
    return response;
});

export const http = {
    get: <T = any>(url: string, options?: RequestOptions) =>
        request(url, { method: "get", ...options }) as Promise<HttpResponse<T>>,

    post: <T = any>(url: string, options?: RequestOptions) =>
        request(url, { method: "post", ...options }) as Promise<
            HttpResponse<T>
        >,

    put: <T = any>(url: string, options?: RequestOptions) =>
        request(url, { method: "put", ...options }) as Promise<HttpResponse<T>>,

    del: <T = any>(url: string, options?: RequestOptions) =>
        request(url, { method: "delete", ...options }) as Promise<
            HttpResponse<T>
        >,

    patch: <T = any>(url: string, options?: RequestOptions) =>
        request(url, { method: "patch", ...options }) as Promise<
            HttpResponse<T>
        >,

    head: <T = any>(url: string, options?: RequestOptions) =>
        request(url, { method: "head", ...options }) as Promise<
            HttpResponse<T>
        >,

    options: <T = any>(url: string, options?: RequestOptions) =>
        request(url, { method: "options", ...options }) as Promise<
            HttpResponse<T>
        >,
};
