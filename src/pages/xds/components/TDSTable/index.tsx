import HttpMethodTag from "@/components/HttpMethodTag";
import { useFlatInject, useHttp } from "@/utils/hooks";
import { useTabKey } from "@/utils/tabkey";
import { Table } from "antd";

interface TDSx {
    method: string;
    path: string;
}

interface TDS {
    id: string;
    name: string;
    description: string;
    tds_ext_info: TDSx;
}

export default () => {
    const tabKey = useTabKey();
    const [xdsStroe] = useFlatInject("xds");
    const [connStore] = useFlatInject("connection");
    const { mapConnection } = connStore;
    const { onFetchTDS } = xdsStroe;

    const { loading: loadingTDS } = useHttp(() =>
        onFetchTDS(tabKey, mapConnection(tabKey))
    );

    const tdsColumns = [
        {
            title: "Name",
            key: "name",
            dataIndex: "name",
            width: 150,
        },
        {
            title: "Method",
            key: "method",
            width: 100,
            render: (_: any, record: TDS) => {
                return <HttpMethodTag method={record.tds_ext_info.method} />;
            },
        },
        {
            title: "Path",
            key: "path",
            width: 260,
            render: (_: any, record: TDS) => record.tds_ext_info.path,
        },
        {
            title: "Description",
            key: "description",
            width: 240,
            render: (_: any, record: TDS) => record.description || "-",
        },
    ];

    return (
        <Table
            loading={loadingTDS}
            rowKey="id"
            size="small"
            dataSource={xdsStroe.tDS.tabData[tabKey]}
            columns={tdsColumns}
            pagination={false}
        />
    );
};
