import { useFlatInject as useFlatInjectOriginal } from "@/utils/hooks";
import { SettingOutlined, StarFilled } from "@ant-design/icons";
import { Button, Layout, Tooltip } from "antd";
import { useRef } from "react";
import { Outlet, useNavigate } from "umi";
import { v4 as uuidv4 } from "uuid";
import HeaderTab from "./components/HeaderTab";

const { Header, Content } = Layout;
const LayoutFC = () => {
    const [chatStore] = useFlatInjectOriginal("chat");
    const nav = useNavigate();
    const headerTabRef = useRef<any>(null);

    const handleDragStart = (event: any) => {
        event.preventDefault();
    };

    const addSettingsTab = async () => {
        // Check if settings tab already exists
        if (headerTabRef.current?.hasSettingsTab()) {
            // If settings tab exists, switch to it
            headerTabRef.current.switchToSettingsTab();
            return;
        }
        // Create a new settings tab
        const newKey = uuidv4();
        nav(`/settings?tabKey=${newKey}`);
    };

    const renderItem = (name: string, url: string, isStarred?: boolean) => ({
        value: url,
        label: (
            <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <span>{name}</span>
                    {isStarred && <StarFilled style={{ color: "#fadb14" }} />}
                </div>
                <div style={{ color: "#888", fontSize: 11 }}>{url}</div>
            </div>
        ),
    });

    const renderEmptyItem = (label: string) => ({
        value: "",
        label: (
            <div
                style={{
                    fontSize: 11,
                    color: "#999",
                    fontStyle: "italic",
                }}
            >
                {label}
            </div>
        ),
        disabled: true,
    });



    return (
        <Layout className="custom-layout" style={{ minHeight: "100vh" }}>
            <Header
                data-tauri-drag-region
                onMouseDown={handleDragStart}
                style={{
                    backgroundColor: "#595959",
                    height: 36,
                    userSelect: "none",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0 16px 0 70px", // 左边70px，右边16px
                }}
                className="tauri-drag"
            >
                <div className="app-title">
                    <div className="app-title-main">A2A</div>
                    <div className="app-title-sub">Client UI</div>
                </div>
                <HeaderTab ref={headerTabRef} />

                {/* Settings button - moved outside HeaderTab */}
                <Tooltip title="Settings">
                    <Button
                        type="text"
                        size="small"
                        className="settings-btn"
                        onClick={addSettingsTab}
                    >
                        <SettingOutlined />
                    </Button>
                </Tooltip>
            </Header>
            <Layout>
                <Layout>
                    <Content className="custom-layout">
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>

        </Layout>
    );
};

export default LayoutFC;
