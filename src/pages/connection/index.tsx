import logo from "@/assets/dynmcp.png";
import { DynmcpConnection } from "@/types/connection";
import { useTabKey } from "@/utils/tabkey";
import { LinkOutlined, StarOutlined } from "@ant-design/icons";
import type { FormProps } from "antd";
import { Button, Flex, Form, Input, message, Typography } from "antd";
import KeepAlive from "react-activation";
import { useNavigate } from "umi";
import { useFlatInject } from "@/utils/hooks";
import PrefixSelector from "./components/PrefixSelector";

const { Title } = Typography;

export default () => {
    const navigate = useNavigate();
    let tabKey = useTabKey();
    const [store] = useFlatInject("connection");

    const onFinish: FormProps<any>["onFinish"] = async (formData) => {
        try {
            const { scheme, url, ...rest } = formData;
            const fullUrl = `${scheme}://${url}`;
            const con: DynmcpConnection = {
                ...rest,
                url: fullUrl,
                starred: formData.starred ?? false,
            };
            console.log("onFinish", con);
            await store.onFinishFrom(tabKey, con);
            navigate(`/xds?tabKey=${tabKey}`);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "unknown error while saving connection";
            console.log(error);
            message.error(errMsg);
        }
    };

    return (
        <KeepAlive
            name={"connectionFormKeepalive"}
            cacheKey={tabKey || "default"}
        >
            <Flex justify="center" align="center" style={{ height: "75vh" }}>
                <div
                    style={{
                        width: "100%",
                        maxWidth: 500,
                        padding: 12,
                        borderRadius: 12,
                        background: "#fff",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 12,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <Title level={5} style={{ margin: 0 }}>
                                Connect to
                            </Title>
                            <img
                                src={logo}
                                alt="logo"
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 6,
                                    marginLeft: 2,
                                }}
                            />
                        </div>

                        <Button
                            type="text"
                            icon={
                                <StarOutlined
                                    style={{
                                        color: "#fadb14",
                                    }}
                                />
                            }
                            style={{ color: "#ff4d4f" }}
                        />
                    </div>

                    <Form
                        name="connect"
                        labelCol={{ span: 5 }}
                        wrapperCol={{ span: 18 }}
                        onFinish={onFinish}
                        initialValues={{ scheme: "http" }}
                    >
                        <Form.Item<DynmcpConnection>
                            label="Name"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input name",
                                },
                            ]}
                            style={{ marginBottom: 12 }}
                        >
                            <Input
                                placeholder="e.g. dev-server"
                                autoCapitalize="off"
                                spellCheck={false}
                            />
                        </Form.Item>

                        <Form.Item<DynmcpConnection>
                            label="URL"
                            name="url"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input host",
                                },
                            ]}
                            style={{ marginBottom: 12 }}
                        >
                            <Input
                                addonBefore={<PrefixSelector />}
                                placeholder="localhost:8000"
                                autoCapitalize="off"
                                spellCheck={false}
                            />
                        </Form.Item>

                        <Form.Item<DynmcpConnection>
                            label="API Key"
                            name="api_key"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input API Key",
                                },
                            ]}
                            style={{ marginBottom: 12 }}
                        >
                            <Input.Password
                                placeholder="sk-xxxxx"
                                autoCapitalize="off"
                                spellCheck={false}
                            />
                        </Form.Item>

                        <Form.Item
                            wrapperCol={{ offset: 5, span: 18 }}
                            style={{ marginBottom: 8 }}
                        >
                            <Flex justify="end">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<LinkOutlined />}
                                    style={{ fontSize: 12 }}
                                    htmlType="submit"
                                >
                                    Connect
                                </Button>
                            </Flex>
                        </Form.Item>
                    </Form>
                </div>
            </Flex>
        </KeepAlive>
    );
};
