export default [
    {
        path: "/",
        component: "@/layouts/TabLayout",
        isMenu: false,
        routes: [
            {
                path: "/",
                redirect: "/a2a",
            },
            {
                name: "New Connection",
                path: "/new_connection",
                component: "connection",
            },
            {
                name: "xDS",
                path: "/xds",
                component: "xds",
            },
            {
                name: "A2A Client",
                path: "/a2a",
                component: "a2a",
            },
            {
                name: "Settings",
                path: "/settings",
                component: "settings",
            },
        ],
    },
];
