import { deleteIDS, fetchIDS, putIDS } from "@/request/apis/xds/ids";
import { deleteTDS, fetchTDS, putTDS } from "@/request/apis/xds/tds";
import { DynmcpConnection } from "@/types/connection";
import { TabKeyType } from "@/types/tab";
import {
    IDSItem,
    IDSResponse,
    TDSItem,
    TDSResponse,
    UploadSwaggerData,
    VisiableComponent,
    VisiableData,
} from "@/types/xds";
import { NaturFactory } from "@/utils/NaturFactory";
import { buildTdsFromInput, InputSchemaItem } from "@/utils/swagger";
import { TabData } from "./tabdata";

const initState = {
    tDS: {
        tabData: {},
    } as TabData<TDSResponse>,

    iDS: {
        tabData: {},
    } as TabData<IDSResponse>,
    visiableData: {
        tabData: {},
    } as TabData<VisiableData>,
    refresh: {
        tabData: {},
    } as TabData<Boolean>,
    uploadSwaggerData: {
        tabData: {},
    } as TabData<UploadSwaggerData>,
};

const DEFULT_VISIABLE_DATA: VisiableData = {
    component: VisiableComponent.Overview,
    scene: "overview",
};

const state = initState;
type State = typeof state;
const createMap = NaturFactory.mapCreator(state);

const actions = NaturFactory.actionsCreator(state)({
    onFetchTDS: (tabKey: TabKeyType, conn: DynmcpConnection) => async (api) => {
        const realKey = tabKey ?? "default";
        const res = await fetchTDS({ api_key: conn.api_key });
        api.setState((s: State) => {
            s.tDS.tabData[realKey] = res;
        });
    },
    onFetchIDS: (tabKey: TabKeyType, conn: DynmcpConnection) => async (api) => {
        const realKey = tabKey ?? "default";
        const res = await fetchIDS({ api_key: conn.api_key });
        api.setState((s: State) => {
            s.iDS.tabData[realKey] = res;
        });
    },
    onVisiableData: (tabKey: TabKeyType, data: VisiableData) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            s.visiableData.tabData[realKey] = data;
        });
    },
    onEditVisiableValue: (tabKey: TabKeyType, value: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.visiableData.tabData[realKey]) {
                s.visiableData.tabData[realKey] = {} as VisiableData;
            }
            s.visiableData.tabData[realKey].value = value;
        });
    },
    onEditVisiableValue4Swagger:
        (tabKey: TabKeyType, swagger: InputSchemaItem) => async (api) => {
            const realKey = tabKey ?? "default";
            api.setState((s: State) => {
                if (!s.visiableData.tabData[realKey]) {
                    s.visiableData.tabData[realKey] = {} as VisiableData;
                }
                s.visiableData.tabData[realKey].value =
                    buildTdsFromInput(swagger);
                s.uploadSwaggerData.tabData[realKey].visiable = false;    
            });
        },

    onPutTDS: (tabKey: TabKeyType, conn: DynmcpConnection) => async (api) => {
        const realKey = tabKey ?? "default";
        const state = api.getState();
        const editorBody = state.visiableData.tabData[realKey].value;
        const body: TDSItem = JSON.parse(editorBody ?? "");
        await putTDS({ api_key: conn.api_key }, body);
        api.setState((s: State) => {
            s.refresh.tabData[realKey] = !s.refresh.tabData[realKey];
            s.visiableData.tabData[realKey] = DEFULT_VISIABLE_DATA;
        });
    },
    onPutIDS: (tabKey: TabKeyType, conn: DynmcpConnection) => async (api) => {
        const realKey = tabKey ?? "default";
        const state = api.getState();
        const editorBody = state.visiableData.tabData[realKey].value;
        const body: IDSItem = JSON.parse(editorBody ?? "");
        await putIDS({ api_key: conn.api_key }, body);
        api.setState((s: State) => {
            s.refresh.tabData[realKey] = !s.refresh.tabData[realKey];
            s.visiableData.tabData[realKey] = DEFULT_VISIABLE_DATA;
        });
    },
    onDeleteTDS:
        (tabKey: TabKeyType, conn: DynmcpConnection) => async (api) => {
            const realKey = tabKey ?? "default";
            const state = api.getState();
            const editorBody = state.visiableData.tabData[realKey].value;
            const body: IDSItem = JSON.parse(editorBody ?? "");
            const res = await deleteTDS({ api_key: conn.api_key }, body.id);
            api.setState((s: State) => {
                s.refresh.tabData[realKey] = !s.refresh.tabData[realKey];
                s.visiableData.tabData[realKey] = DEFULT_VISIABLE_DATA;
            });
        },
    onDeleteIDS:
        (tabKey: TabKeyType, conn: DynmcpConnection) => async (api) => {
            const realKey = tabKey ?? "default";
            const state = api.getState();
            const editorBody = state.visiableData.tabData[realKey].value;
            const body: IDSItem = JSON.parse(editorBody ?? "");
            const res = await deleteIDS({ api_key: conn.api_key }, body.id);
            api.setState((s: State) => {
                s.refresh.tabData[realKey] = !s.refresh.tabData[realKey];
                s.visiableData.tabData[realKey] = DEFULT_VISIABLE_DATA;
            });
        },
    onVisiableUploadSwagger:
        (tabKey: TabKeyType, isVisiable: boolean) => async (api) => {
            const realKey = tabKey ?? "default";
            api.setState((s: State) => {
                if (!s.uploadSwaggerData.tabData[realKey]) {
                    s.uploadSwaggerData.tabData[realKey] =
                        {} as UploadSwaggerData;
                }
                s.uploadSwaggerData.tabData[realKey].visiable = isVisiable;
            });
        },
    onUpdateUploadSwagger:
        (tabKey: TabKeyType, parsedSchemas: InputSchemaItem[]) =>
        async (api) => {
            const realKey = tabKey ?? "default";
            api.setState((s: State) => {
                if (!s.uploadSwaggerData.tabData[realKey]) {
                    s.uploadSwaggerData.tabData[realKey] =
                        {} as UploadSwaggerData;
                }
                s.uploadSwaggerData.tabData[realKey].parsedSchemas =
                    parsedSchemas;
            });
        },
});

export const maps = {
    mapIDS: createMap(
        (state: State) => state.iDS.tabData,
        (state: State) => state.tDS.tabData,
        (
            idsTabData: Record<string, IDSResponse>,
            tdsTabData: Record<string, TDSResponse>
        ) => {
            return (tabKey: TabKeyType): IDSResponse => {
                const key = tabKey ?? "default";
                const idsList = idsTabData[key] ?? [];
                const tdsList = tdsTabData[key] ?? [];
                const tdsMap = new Map<string, TDSItem>();
                for (const tds of tdsList) {
                    tdsMap.set(tds.id, tds);
                }
                return idsList.map((idsItem) => {
                    const tds_items = idsItem.tool_ids
                        .map((tool_id) => tdsMap.get(tool_id))
                        .filter((item): item is TDSItem => !!item);
                    const res = {
                        ...idsItem,
                        tds_items,
                    };
                    console.log("mapIDS", res);
                    return res;
                });
            };
        }
    ),
    mapVisiableData: createMap(
        (state: State) => state.visiableData.tabData,
        (tabData: Record<string, VisiableData>) => {
            return (tabKey: TabKeyType): VisiableData => {
                const key = tabKey ?? "default";
                const res = tabData[key] ?? DEFULT_VISIABLE_DATA;
                return res;
            };
        }
    ),
};

export default {
    name: "xds",
    state,
    actions,
    maps,
};
