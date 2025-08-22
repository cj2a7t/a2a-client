export type DynmcpConnection = {
    id?: number;
    name: string;
    url: string;
    api_key: string;
    starred: boolean;
};

export type InvokeResult<T> = {
    code: number;
    message: string;
    data?: T;
};
