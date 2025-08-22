import { defineConfig } from "umi";
import routes from "../src/routes";

export default defineConfig({
    routes: routes,
    npmClient: "pnpm",
    plugins: ["umi-natur"],
    natur: {
        useImmer: true,
    },
    mfsu: false,
    esbuildMinifyIIFE: true,
    proxy: {
        "/admin": {
            target: "http://localhost:8080",
            changeOrigin: true,
        },
    },
});
