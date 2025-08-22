import HttpMethodTag from "@/components/HttpMethodTag";
import { IDSItem, TDSItem } from "@/types/xds";
import { useFlatInject, useHttp } from "@/utils/hooks";
import { useTabKey } from "@/utils/tabkey";
import { Table } from "antd";

export default () => {
    const tabKey = useTabKey();
    const [xdsStroe] = useFlatInject("xds");
    const [connStore] = useFlatInject("connection");
    const { mapConnection } = connStore;
    const { onFetchIDS, onFetchTDS, mapIDS } = xdsStroe;

    const { loading: loadingIDS } = useHttp(
        () => onFetchIDS(tabKey, mapConnection(tabKey))
        // { deps: [connStore.mapConnection(tabKey)] }
    );
    const { loading: loadingTDS } = useHttp(
        () => onFetchTDS(tabKey, mapConnection(tabKey))
        // { deps: [connStore.mapConnection(tabKey)] }
    );

    const idsColumns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 180,
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            width: 200,
        },
        {
            title: "Tools",
            key: "toolCount",
            width: 100,
            render: (_: any, record: IDSItem) =>
                `Tools: ${record.tool_ids.length}`,
        },
    ];

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
            render: (_: any, record: TDSItem) => {
                return <HttpMethodTag method={record.tds_ext_info.method} />;
            },
        },
        {
            title: "Path",
            key: "path",
            width: 260,
            render: (_: any, record: TDSItem) => record.tds_ext_info.path,
        },
        {
            title: "Description",
            key: "description",
            width: 240,
            render: (_: any, record: TDSItem) => record.description || "-",
        },
    ];

    return (
        <Table
            loading={loadingIDS || loadingTDS}
            rowKey="id"
            size="small"
            dataSource={mapIDS(tabKey)}
            columns={idsColumns}
            expandable={{
                expandedRowRender: (record: IDSItem) => (
                    <Table
                        rowKey="id"
                        columns={tdsColumns}
                        dataSource={record.tds_items}
                        pagination={false}
                        size="small"
                    />
                ),
                rowExpandable: (record) =>
                    Array.isArray(record.tds_items) &&
                    record.tds_items.length > 0,
            }}
            pagination={false}
        />
    );
};
