import { ConfigProvider } from "antd";
import { ReactNode } from "react";
import { AliveScope } from "react-activation";

const App = ({ children }: { children: ReactNode }) => (
    <ConfigProvider
        theme={{
            token: {
                fontSize: 12,
            },
            // algorithm: theme.compactAlgorithm,
            // algorithm: theme.darkAlgorithm,
        }}
    >
        <AliveScope>{children}</AliveScope>
    </ConfigProvider>
);

export const rootContainer = (container: any) => <App>{container}</App>;
