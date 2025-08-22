import { VisiableComponent } from "@/types/xds";
import { useFlatInject } from "@/utils/hooks";
import { useTabKey } from "@/utils/tabkey";
import { Splitter } from "antd";
import KeepAlive from "react-activation";
import Editor from "./components/Editor";
import IDSTable from "./components/IDSTable";
import MenuTree from "./components/MenuTree";
import Overview from "./components/Overview";
import TDSTable from "./components/TDSTable";

const component2ReactNode: Record<
    VisiableComponent,
    (data: string) => React.ReactNode
> = {
    [VisiableComponent.Editor]: (_) => <Editor />,
    [VisiableComponent.Overview]: (_) => <Overview />,
    [VisiableComponent.TDSTable]: (_) => <TDSTable />,
    [VisiableComponent.IDSTable]: (_) => <IDSTable />,
};

export default () => {
    let tabKey = useTabKey();
    const [xdsStore] = useFlatInject("xds");
    const { mapVisiableData } = xdsStore;

    const visibleData = mapVisiableData(tabKey);

    return (
        <KeepAlive name="xdsKeepalive" cacheKey={tabKey}>
            <Splitter>
                <Splitter.Panel defaultSize="20%" max="25%" min={"20%"}>
                    <MenuTree />
                </Splitter.Panel>
                <Splitter.Panel>
                    {component2ReactNode[visibleData.component](
                        visibleData.value ?? ""
                    )}
                </Splitter.Panel>
            </Splitter>
        </KeepAlive>
    );
};
