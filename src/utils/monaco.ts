import { loader } from "@monaco-editor/react";

export const initMonacoTheme = async () => {
    const monaco = await loader.init();

    monaco.editor.defineTheme("customTheme", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#f5f5f5",
        },
    });

    return monaco;
};
