import { useLocation } from "umi";

export const useTabKey = (): string => {
    const location = useLocation();
    return new URLSearchParams(location.search).get("tabKey") ?? "";
};

export const getTabKey = (search: string): string => {
    return new URLSearchParams(search).get("tabKey") ?? "";
};
