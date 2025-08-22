import { TDSItem, TDSResponse, xDSParam } from "@/types/xds";
import { http } from "@/utils/http";
import { v4 as uuidv4 } from "uuid";

export const fetchTDS = async (params: xDSParam) => {
    const headers: Record<string, string> = {
        "x-api-key": params.api_key || "",
    };
    const res = await http.get<TDSResponse>("/admin/tds", { headers });
    if (res.code !== 200) {
        throw new Error(res.message);
    }
    return res.data;
};

export const putTDS = async (
    params: xDSParam,
    body: TDSItem
): Promise<TDSItem> => {
    const headers = {
        "x-api-key": params.api_key || "",
        "Content-Type": "application/json",
    };

    const id = body.id || uuidv4();
    const data = { ...body, id };

    const res = await http.put<TDSItem>(`/admin/tds/${id}`, {
        data,
        headers,
    });

    if (res.code !== 200) throw new Error(res.message);
    return res.data;
};

export const deleteTDS = async (
    params: xDSParam,
    id: string
): Promise<string> => {
    const headers = {
        "x-api-key": params.api_key || "",
    };

    const res = await http.del<string>(`/admin/tds/${id}`, {
        headers,
    });

    if (res.code !== 200) {
        throw new Error(res.message);
    }

    return res.data;
};
