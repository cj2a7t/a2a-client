import * as Icons from "@ant-design/icons";

interface IconRendererProps {
    iconName: string;
    size?: number;
}

export default ({ iconName, size = 16 }: IconRendererProps) => {
    const IconComponent = (
        Icons as unknown as Record<string, React.ComponentType<any>>
    )[iconName];

    return IconComponent ? <IconComponent style={{ fontSize: size }} /> : null;
};
