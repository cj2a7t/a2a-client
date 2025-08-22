import { useFlatInject, useHttp } from "@/utils/hooks";
import { useTabKey, getTabKey } from "@/utils/tabkey";
import { StarFilled, SettingOutlined } from "@ant-design/icons";
import { Layout, Button, Tooltip } from "antd";
import { Outlet } from "umi";
import HeaderTab from "./components/HeaderTab";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useLocation } from "umi";
import { useFlatInject as useFlatInjectOriginal } from "@/utils/hooks";
import { useRef } from "react";

const { Header, Content } = Layout;
const LayoutFC = () => {
    const [store] = useFlatInject("connection");
    const [a2aStore] = useFlatInjectOriginal("a2a");
    const tabKey = useTabKey();
    const nav = useNavigate();
    const location = useLocation();
    const headerTabRef = useRef<any>(null);
    const { loading: loadingFetchCon } = useHttp(() =>
        store.onFetchConnections()
    );

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
        
        // Set loading state for the new tab
        await a2aStore.setTabLoading(newKey, true);
        nav(`/settings?tabKey=${newKey}`);
        
        // Clear loading state after a short delay
        setTimeout(async () => {
            await a2aStore.setTabLoading(newKey, false);
        }, 500);
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

    const starredConnections = store.connections.filter((c) => c.starred);
    const recentConnections = store.connections.filter((c) => !c.starred);

    const options = [
        {
            label: <span style={{ fontSize: 11 }}>⭐ Starred Connections</span>,
            options:
                starredConnections.length > 0
                    ? starredConnections.map((conn) =>
                        renderItem(conn.name, conn.url, true)
                    )
                    : [renderEmptyItem("No starred connections")],
        },
        {
            label: <span style={{ fontSize: 11 }}>🕑 Recent Connections</span>,
            options:
                recentConnections.length > 0
                    ? recentConnections.map((conn) =>
                        renderItem(conn.name, conn.url, false)
                    )
                    : [renderEmptyItem("No recent connections")],
        },
    ];

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
