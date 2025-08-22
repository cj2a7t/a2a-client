import { useFlatInject } from "@/utils/hooks";
import { initMonacoTheme } from "@/utils/monaco";
import { useTabKey } from "@/utils/tabkey";
import {
    DeleteOutlined,
    EditOutlined,
    SaveOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { Editor } from "@monaco-editor/react";
import { Button, message } from "antd";
import { useEffect } from "react";
import UploadSwagger from "../UploadSwagger";
import styles from "./index.module.less";

export default () => {
    useEffect(() => {
        initMonacoTheme();
    }, []);

    const tabKey = useTabKey();
    const [xdsStore] = useFlatInject("xds");
    const [connStore] = useFlatInject("connection");
    const { mapConnection } = connStore;
    const { onPutTDS, onPutIDS, onDeleteIDS, onDeleteTDS } = xdsStore;
    const visiableData = xdsStore.visiableData.tabData[tabKey];
    const uploadSwaggerData = xdsStore.uploadSwaggerData.tabData[tabKey] ?? {
        visiable: false,
    };

    return (
        <div>
            <div className={styles.header}>
                <span className={styles.title}>Config JSON</span>
                <div>
                    {visiableData?.editMode == true && (
                        <>
                            <Button
                                size="small"
                                type="default"
                                danger
                                icon={<DeleteOutlined />}
                                className={`${styles.button} ${styles.deleteButton}`}
                                onClick={async () => {
                                    try {
                                        if (visiableData?.scene === "put_tds") {
                                            await onDeleteTDS(
                                                tabKey,
                                                mapConnection(tabKey)
                                            );
                                            message.success(
                                                `TDS deleted successfully`
                                            );
                                        } else {
                                            await onDeleteIDS(
                                                tabKey,
                                                mapConnection(tabKey)
                                            );
                                            message.success(
                                                `IDS deleted successfully`
                                            );
                                        }
                                    } catch (error) {
                                        message.error(
                                            "Failed to delete. Please try again."
                                        );
                                    }
                                }}
                            >
                                Delete
                            </Button>

                            <Button
                                size="small"
                                type="primary"
                                icon={<EditOutlined />}
                                className={styles.button}
                                onClick={async () => {
                                    try {
                                        if (visiableData?.scene === "put_tds") {
                                            await onPutTDS(
                                                tabKey,
                                                mapConnection(tabKey)
                                            );
                                            message.success(
                                                `TDS saved successfully`
                                            );
                                        } else {
                                            await onPutIDS(
                                                tabKey,
                                                mapConnection(tabKey)
                                            );
                                            message.success(
                                                `IDS saved successfully`
                                            );
                                        }
                                    } catch (error) {
                                        message.error(
                                            "Failed to save. Please check your input."
                                        );
                                    }
                                }}
                            >
                                Edit
                            </Button>
                        </>
                    )}

                    {visiableData?.editMode == false && (
                        <>
                            {visiableData?.scene === "put_tds" && (
                                <Button
                                    className={styles.button}
                                    size="small"
                                    icon={<UploadOutlined />}
                                    onClick={() => {
                                        xdsStore.onVisiableUploadSwagger(
                                            tabKey,
                                            true
                                        );
                                    }}
                                >
                                    Import From Swagger JSON
                                </Button>
                            )}
                            <Button
                                size="small"
                                type="primary"
                                icon={<SaveOutlined />}
                                className={styles.button}
                                onClick={() => {
                                    visiableData?.scene == "put_tds"
                                        ? onPutTDS(
                                              tabKey,
                                              mapConnection(tabKey)
                                          )
                                        : onPutIDS(
                                              tabKey,
                                              mapConnection(tabKey)
                                          );
                                    message.success(
                                        visiableData?.scene === "put_tds"
                                            ? `TDS saved successfully`
                                            : `IDS saved successfully`
                                    );
                                }}
                            >
                                Save
                            </Button>
                        </>
                    )}
                </div>
            </div>
            <Editor
                height="90vh"
                defaultLanguage="json"
                value={visiableData?.value ?? ""}
                theme="customTheme"
                options={{
                    fontSize: 11,
                    tabSize: 4,
                    insertSpaces: true,
                    detectIndentation: false,
                    autoIndent: "full",
                    minimap: { enabled: false },
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                        useShadows: false,
                    },
                }}
                onChange={(value) => {
                    xdsStore.onEditVisiableValue(tabKey, value ?? "");
                }}
            />
            {uploadSwaggerData.visiable && <UploadSwagger />}
        </div>
    );
};
