use ai::chat_completions::ChatCompletion;
use ai::{Result, chat_completions::ChatCompletionMessage, clients::openai::Client as AiClient};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::{
    db::model_db::SettingModelDbManager,
    model::{
        A2AMessage, A2AMessageParams, A2AMessagePart, A2ARequest, AgentCard, AgentCardParams,
        ChatCompletionParams, ChatCompletionStreamParams, InvokeResponse, JSONRPCRequest,
        SettingModel, SettingModelParams, UpdateSettingModelParams, to_invoke_response,
    },
};

// Define data structure for streaming chat events
#[derive(Serialize, Deserialize, Clone)]
pub struct StreamChunk {
    pub content: String,
    pub is_complete: bool,
    pub error: Option<String>,
    pub status: Option<String>,
    pub message: Option<String>,
}

#[tauri::command]
pub async fn chat_completion(params: ChatCompletionParams) -> InvokeResponse<String> {
    log::info!("Starting chat completion with AI API");

    // Validate parameters
    if params.api_key.trim().is_empty() {
        log::error!("API key is empty");
        return InvokeResponse::fail("API key cannot be empty".to_string());
    }

    if params.system_prompt.trim().is_empty() && params.user_prompt.trim().is_empty() {
        log::error!("Both system_prompt and user_prompt are empty");
        return InvokeResponse::fail(
            "At least one of system_prompt or user_prompt must be provided".to_string(),
        );
    }

    // Create AI client using ai.rs library
    let client = match create_ai_client(&params.api_key).await {
        Ok(client) => client,
        Err(e) => return InvokeResponse::fail(format!("Failed to create AI client: {}", e)),
    };

    // Build messages using ai.rs types
    let messages = build_chat_messages(&params);

    // Create request using ai.rs
    let request = match ai::chat_completions::ChatCompletionRequestBuilder::default()
        .model("deepseek-chat")
        .messages(messages)
        .temperature(0.7)
        .build()
    {
        Ok(req) => req,
        Err(e) => return InvokeResponse::fail(format!("Failed to build request: {}", e)),
    };

    log::info!("Sending request to AI API with model: deepseek-chat");

    // Send request using ai.rs
    match client.chat_completions(&request).await {
        Ok(response) => {
            log::info!("Successfully received response from AI API");

            if let Some(content) = response
                .choices
                .first()
                .and_then(|choice| choice.message.content.as_ref())
            {
                return InvokeResponse::success(content.clone());
            }

            log::warn!("Unexpected response format: {:?}", response);
            InvokeResponse::fail("Unexpected response format".to_string())
        }
        Err(e) => {
            log::error!("Request failed: {}", e);
            InvokeResponse::fail(format!("Request failed: {}", e))
        }
    }
}

#[tauri::command]
pub async fn chat_completion_stream(
    params: ChatCompletionStreamParams,
    handle: AppHandle,
) -> InvokeResponse<String> {
    return InvokeResponse::fail("Not implemented".to_string());
}

#[tauri::command]
pub async fn get_agent_card(params: AgentCardParams) -> InvokeResponse<AgentCard> {
    let client = Client::new();

    let full_url = if !params.url.starts_with("http://") && !params.url.starts_with("https://") {
        format!("http://{}", params.url)
    } else {
        params.url.clone()
    };

    let response = client
        .get(&full_url)
        .header("Accept", "application/json")
        .send()
        .await;

    match response {
        Ok(resp) => {
            let status = resp.status();

            // Read body, but preserve error information
            let body_text = match resp.text().await {
                Ok(text) => text,
                Err(e) => {
                    log::error!("Failed to read body: {}", e);
                    return InvokeResponse::fail(format!("Failed to read response body: {}", e));
                }
            };

            if !status.is_success() {
                log::error!("Request failed with status {}. Body: {}", status, body_text);
                return InvokeResponse::fail(format!(
                    "Request failed with status {}: {}",
                    status, body_text
                ));
            }

            match serde_json::from_str::<AgentCard>(&body_text) {
                Ok(agent_card) => InvokeResponse::success(agent_card),
                Err(e) => {
                    log::error!(
                        "Failed to parse agent card response: {}. Body: {}",
                        e,
                        body_text
                    );
                    InvokeResponse::fail(format!("Failed to parse response: {}", e))
                }
            }
        }
        Err(e) => {
            log::error!("Failed to send request: {}", e);
            InvokeResponse::fail(format!("Request failed: {}", e))
        }
    }
}

#[tauri::command]
pub async fn send_a2a_message(params: A2AMessageParams) -> InvokeResponse<String> {
    let client = Client::new();

    let full_url =
        if !params.a2a_url.starts_with("http://") && !params.a2a_url.starts_with("https://") {
            format!("http://{}", params.a2a_url)
        } else {
            params.a2a_url.clone()
        };

    let message_id = params.message_id.clone();
    let request_body = A2ARequest {
        id: params.task_id,
        message: A2AMessage {
            message_id: params.message_id,
            kind: "message".to_string(),
            role: "user".to_string(),
            parts: vec![A2AMessagePart {
                kind: "text".to_string(),
                text: params.text,
            }],
        },
        metadata: serde_json::Value::Object(serde_json::Map::new()),
    };

    let jsonrpc_request = JSONRPCRequest {
        jsonrpc: "2.0".to_string(),
        id: message_id,
        method: "message/send".to_string(),
        params: request_body,
    };

    let response = client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .header("X-A2A-Skill-Id", params.header_skill_id)
        .json(&jsonrpc_request)
        .send()
        .await;

    match response {
        Ok(resp) => {
            let status = resp.status();
            if !status.is_success() {
                let error_text = resp.text().await.unwrap_or_default();
                return InvokeResponse::fail(format!(
                    "A2A request failed with status {}: {}",
                    status, error_text
                ));
            }

            match resp.text().await {
                Ok(response_text) => InvokeResponse::success(response_text),
                Err(e) => {
                    log::error!("Failed to read A2A response body: {}", e);
                    InvokeResponse::fail(format!("Failed to read response body: {}", e))
                }
            }
        }
        Err(e) => {
            log::error!("Failed to send A2A request: {}", e);
            InvokeResponse::fail(format!("Request failed: {}", e))
        }
    }
}

// Model configuration related commands

#[tauri::command]
pub async fn save_setting_model(
    params: SettingModelParams,
) -> InvokeResponse<i64> {
    let db_manager = SettingModelDbManager::new();

    db_manager
        .insert(&params)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn update_setting_model(
    params: UpdateSettingModelParams,
) -> InvokeResponse<usize> {
    let db_manager = SettingModelDbManager::new();

    db_manager
        .update(&params)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn get_all_setting_models() -> InvokeResponse<Vec<SettingModel>> {
    let db_manager = SettingModelDbManager::new();

    db_manager
        .get_all()
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn get_enabled_setting_models() -> InvokeResponse<Vec<SettingModel>> {
    let db_manager = SettingModelDbManager::new();

    db_manager
        .get_enabled()
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn toggle_setting_model_enabled(id: i32) -> InvokeResponse<usize> {
    let db_manager = SettingModelDbManager::new();

    db_manager
        .toggle_enabled(id)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn delete_setting_model(id: i32) -> InvokeResponse<usize> {
    let db_manager = SettingModelDbManager::new();

    db_manager
        .delete_by_id(id)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn ensure_single_setting_model_enabled(
    enabled_id: i32,
) -> InvokeResponse<usize> {
    let db_manager = SettingModelDbManager::new();

    db_manager
        .ensure_single_enabled(enabled_id)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

// Export A2A server module
pub mod a2a_server;
pub mod chat;

// Helper function to create AI client
async fn create_ai_client(api_key: &str) -> Result<AiClient> {
    // Create client with custom base URL for DeepSeek
    let client = AiClient::from_url(api_key, "https://api.deepseek.com/v1")?;
    Ok(client)
}

// Helper function to build chat messages using ai.rs types
fn build_chat_messages(params: &ChatCompletionParams) -> Vec<ChatCompletionMessage> {
    let mut messages = Vec::new();

    if !params.system_prompt.trim().is_empty() {
        messages.push(ChatCompletionMessage::System(
            params.system_prompt.clone().into(),
        ));
    }

    messages.push(ChatCompletionMessage::User(
        params.user_prompt.clone().into(),
    ));

    messages
}
