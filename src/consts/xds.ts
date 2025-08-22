export const PUT_IDS = {
    name: "Instance Discovery Service Name",
    tool_ids: [],
};

export const PUT_TDS = {
    name: "Tool Discovery Service Name",
    description: "Tool Discovery Service Description",
    input_schema: {},
    tds_ext_info: {
        domain: "[required] Domain for the TDS",
        method: "[required] HTTP method for the TDS",
        path: "[required] Path for the TDS",
        required_params: {},
        ext_info: {},
    },
};
