import routes from "@/routes";
import { NaturFactory } from "@/utils/NaturFactory";

export interface MenuData {
    key: string,
    label?: string,
    iconname?: string,
    type?: string
}

const extractAndConvertRoutes = (routes: any[]): MenuData[] => {
    let result: MenuData[] = [];
    for (const route of routes) {
        if (route.routes) {
            result = result.concat(extractAndConvertRoutes(route.routes));
        } else if (route.name) {
            result.push({
                key: route.path,
                label: route.name,
                iconname: route.icon,
                type: "menu"
            });
        }
    }
    return result;
};

const initState = {
    headMenuList: [
        {
            key: "connection",
            label: "Connection",
            iconname: "AppstoreAddOutlined"
        },
        {
            key: "admin_api",
            label: "Admin API(s)",
            iconname: "GatewayOutlined"
        },
        {
            key: "cp_api",
            label: "Control Plane API(s)",
            iconname: "ApiOutlined"
        }
    ] as MenuData[],
    apiSideMenuList: [

    ] as MenuData[],
    conSideMenuList: [
        {
            key: "quick_con",
            label: "Quick Connect",
            iconname: "ThunderboltOutlined"
        },
        {
            type: 'divider',
        },
        {
            key: "favorites",
            label: "Favorites",
            iconname: "HeartOutlined"
        }
    ] as MenuData[],
    selected: {
        sideMenu: {

        } as MenuData,
        headMenu: {
            key: "admin_api",
            label: "Admin API",
            iconStr: "Api"
        } as MenuData
    }
}
const state = initState;
type State = typeof state;

const actions = NaturFactory.actionsCreator(state)({
    selectHeadMenu: (selectedMenuKey: String) => (api) => {
        const selectedMenu = initState.headMenuList.find((item) => (item.key == selectedMenuKey));
        api.setState((s: State) => {
            s.selected.headMenu = selectedMenu || {} as MenuData
        })
    },
    selectSideMenu: (selectedMenuKey: String) => (api) => {
        const curState = api.getState();
        const selectedMenu = curState.conSideMenuList.find((item) => (item.key == selectedMenuKey));
        console.log(selectedMenu)
        api.setState((s: State) => {
            s.selected.sideMenu = selectedMenu || {} as MenuData
        })
    },
    buildConSideMenuList: () => (api) => {
        const res = extractAndConvertRoutes(routes);
        api.setState((s: State) => {
            s.conSideMenuList = res
        })
    },
})

export default {
    name: "global",
    state,
    actions
}