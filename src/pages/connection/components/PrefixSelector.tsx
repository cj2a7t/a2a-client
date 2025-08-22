import { Form, Select } from "antd";

const { Option } = Select;

export default () => (
    <Form.Item name="scheme" noStyle>
        <Select style={{ width: 80 }}>
            <Option value="http">http</Option>
            <Option value="https">https</Option>
        </Select>
    </Form.Item>
);
