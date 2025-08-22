import styles from "./index.module.less";

interface HttpMethodTagProps {
    method: string;
}

const methodColorMap: Record<string, string> = {
    GET: "#52c41a",
    POST: "#1890ff",
    PUT: "#faad14",
    DELETE: "#f5222d",
    PATCH: "#722ed1",
};

export default ({ method }: HttpMethodTagProps) => {
    const upperMethod = method.toUpperCase();
    const color = methodColorMap[upperMethod] || "#9e9e9e";

    return (
        <span className={styles.tag} style={{ color }}>
            {upperMethod}
        </span>
    );
};
