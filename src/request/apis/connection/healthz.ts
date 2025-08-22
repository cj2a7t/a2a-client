import { http } from "@/utils/http";

export type ConnectionData = {
    name?: string;
    scheme: string;
    host?: string;
    api_key?: string;
};

export const healthz = async (params: Partial<ConnectionData>) => {
    const headers: Record<string, string> = {
        api_key: params.api_key || "",
    };
    const res = await http.get<string>(params.host + "/healthz", { headers });
    if (res.code !== 0) throw new Error(res.message);
    return res.data;
};
