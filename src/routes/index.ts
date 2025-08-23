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
