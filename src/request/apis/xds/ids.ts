import { IDSItem, IDSResponse, xDSParam } from "@/types/xds";
import { http } from "@/utils/http";
import { v4 as uuidv4 } from "uuid";

export const fetchIDS = async (params: xDSParam) => {
    console.log("fetchIDS params:", params);
    const headers: Record<string, string> = {
        "x-api-key": params.api_key || "",
    };
    const res = await http.get<IDSResponse>("/admin/ids", { headers });
    if (res.code !== 200) {
        throw new Error(res.message);
    }
    return res.data;
};

export const putIDS = async (
    params: xDSParam,
    body: IDSItem
): Promise<IDSItem> => {
    const headers = {
        "x-api-key": params.api_key || "",
        "Content-Type": "application/json",
    };

    const id = body.id || uuidv4();
    const data = { ...body, id };

    const res = await http.put<IDSItem>(`/admin/ids/${id}`, {
        data,
        headers,
    });

    if (res.code !== 200) throw new Error(res.message);
    return res.data;
};

export const deleteIDS = async (
    params: xDSParam,
    id: string
): Promise<string> => {
    const headers = {
        "x-api-key": params.api_key || "",
    };

    const res = await http.del<string>(`/admin/ids/${id}`, {
        headers,
    });

    if (res.code !== 200) {
        throw new Error(res.message);
    }

    return res.data;
};
