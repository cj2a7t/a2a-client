import logo from "@/assets/dynmcp.png";
export default () => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: 24,
                color: "#555",
                height: "calc(75vh)",
            }}
        >
            <img
                src={logo}
                alt="Dynamic MCP Logo"
                style={{
                    width: 220,
                    maxWidth: "80%",
                }}
            />

            <div style={{ fontSize: 18, fontWeight: 600 }}>
                Welcome to Dynamic MCP Lens 👋
            </div>

            <div
                style={{
                    fontSize: 14,
                    color: "#888",
                    maxWidth: 480,
                }}
            >
                A visual control plane for managing Dynamic MCP.
            </div>
        </div>
    );
};
