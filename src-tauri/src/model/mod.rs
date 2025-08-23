use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct InvokeResponse<T> {
    pub code: i32,
    pub message: String,
    pub data: Option<T>,
}

impl<T> InvokeResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            code: 0,
            message: "ok".into(),
            data: Some(data),
        }
    }

    pub fn fail(message: impl Into<String>) -> Self {
        Self {
            code: 1,
            message: message.into(),
            data: None,
        }
    }
}

pub fn to_invoke_response<T>(err: anyhow::Error) -> InvokeResponse<T> {
    InvokeResponse::fail(err.to_string())
}

// AI chat related type definitions - Using openai crate instead

#[derive(Debug, Deserialize)]
pub struct ChatCompletionParams {
    pub system_prompt: String,
    pub user_prompt: String,
    pub api_key: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatCompletionStreamParams {
    pub system_prompt: String,
    pub user_prompt: String,
    pub api_key: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentSkill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub examples: Vec<String>,
    #[serde(rename = "inputModes")]
    pub input_modes: Vec<String>,
    #[serde(rename = "outputModes")]
    pub output_modes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentProvider {
    pub organization: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentCapabilities {
    pub streaming: bool,
    #[serde(rename = "pushNotifications")]
    pub push_notifications: bool,
    #[serde(rename = "stateTransitionHistory")]
    pub state_transition_history: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentAuthentication {
    pub schemes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentCard {
    pub name: String,
    pub description: String,
    pub url: String,
    pub provider: AgentProvider,
    pub version: String,
    #[serde(rename = "documentationUrl")]
    pub documentation_url: String,
    pub capabilities: AgentCapabilities,
    pub authentication: Option<AgentAuthentication>,
    #[serde(rename = "defaultInputModes")]
    pub default_input_modes: Vec<String>,
    #[serde(rename = "defaultOutputModes")]
    pub default_output_modes: Vec<String>,
    pub skills: Vec<AgentSkill>,
}

// A2A message related type definitions
#[derive(Debug, Serialize, Deserialize)]
pub struct A2AMessagePart {
    pub kind: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct A2AMessage {
    pub message_id: String,
    pub kind: String,
    pub role: String,
    pub parts: Vec<A2AMessagePart>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct A2ARequest {
    pub id: String,
    pub message: A2AMessage,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JSONRPCRequest<T> {
    pub jsonrpc: String,
    pub id: String,
    pub method: String,
    pub params: T,
}

#[derive(Debug, Deserialize)]
pub struct A2AMessageParams {
    pub a2a_url: String,
    pub task_id: String,
    pub message_id: String,
    pub header_skill_id: String,
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct AgentCardParams {
    pub url: String,
}

// Model configuration related type definitions
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingModel {
    #[serde(skip_deserializing)]
    pub id: Option<i32>,
    pub model_key: String,
    pub enabled: bool,
    pub api_url: String,
    pub api_key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingModelParams {
    pub model_key: String,
    pub enabled: bool,
    pub api_url: String,
    pub api_key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingModelParams {
    pub id: i32,
    pub enabled: Option<bool>,
    pub api_url: Option<String>,
    pub api_key: Option<String>,
}

// A2A Server configuration related type definitions
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingA2AServer {
    #[serde(skip_deserializing)]
    pub id: Option<i32>,
    pub name: String,
    pub agent_card_url: String,
    pub agent_card_json: Option<String>,
    pub enabled: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]

pub struct SettingA2AServerParams {
    pub name: String,
    pub agent_card_url: String,
    pub agent_card_json: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingA2AServerParams {
    pub id: i32,
    pub name: Option<String>,
    pub agent_card_url: Option<String>,
    pub agent_card_json: Option<String>,
    pub enabled: Option<bool>,
}
