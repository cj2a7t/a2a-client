import HttpMethodTag from "@/components/HttpMethodTag";
import { useFlatInject } from "@/utils/hooks";
import { parseInputSchemas } from "@/utils/swagger";
import { useTabKey } from "@/utils/tabkey";
import { CloseOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, List, message, Modal, Upload, UploadProps } from "antd";
import { RcFile } from "antd/es/upload";
import styles from "./index.module.less";

export default () => {
    const tabKey = useTabKey();
    const [xdsStore] = useFlatInject("xds");
    const storeParsedSchemas =
        xdsStore.uploadSwaggerData.tabData[tabKey].parsedSchemas;

    const props: UploadProps = {
        name: "file",
        multiple: false,
        beforeUpload(file: RcFile) {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const content = reader.result;
                    const res = await parseInputSchemas(content);
                    console.log("parseInputSchemas:", res);
                    xdsStore.onUpdateUploadSwagger(tabKey, res);
                    message.success(`${file.name} imported successfully`);
                } catch (err) {
                    message.error(`${file.name} import failed`);
                }
            };
            reader.readAsText(file);
            return false;
        },
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
        },
    };

    return (
        <Modal
            title={<div style={{ fontSize: 12 }}>Import From Swagger JSON</div>}
            open={true}
            footer={null}
            className={styles.customModal}
            closeIcon={<CloseOutlined />}
            styles={{
                body: {
                    maxHeight: 500,
                    overflowY: "auto",
                    padding: 8,
                },
            }}
            onCancel={() => {
                xdsStore.onVisiableUploadSwagger(tabKey, false);
            }}
        >
            <Upload {...props} style={{ width: "100%" }}>
                <Button
                    size="small"
                    icon={<UploadOutlined />}
                    style={{ width: "100%" }}
                >
                    Click to Upload Swagger JSON
                </Button>
            </Upload>
            <List
                size="small"
                className="demo-loadmore-list"
                loading={false}
                itemLayout="horizontal"
                dataSource={storeParsedSchemas}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <a
                                key={item.id}
                                onClick={() => {
                                    xdsStore.onEditVisiableValue4Swagger(
                                        tabKey,
                                        item
                                    );
                                }}
                            >
                                use it
                            </a>,
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <>
                                    <a>{item.url}</a>
                                    <HttpMethodTag method={item.method} />
                                </>
                            }
                            description={
                                <div
                                    style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {item.description}
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
};
