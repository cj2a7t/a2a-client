use ai::chat_completions::{ChatCompletion, ChatCompletionMessage, ChatCompletionRequestBuilder};
use ai::{Result, clients::openai::Client};
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};

use crate::handler::StreamChunk;
use crate::model::{ChatCompletionStreamParams, InvokeResponse};

#[tauri::command]
pub async fn stream_chat(
    params: ChatCompletionStreamParams,
    handle: AppHandle,
) -> InvokeResponse<String> {
    log::info!("Starting streaming chat completion with AI API");

    // Validate parameters
    if params.api_key.trim().is_empty() {
        return error_response("API key cannot be empty");
    }

    if params.system_prompt.trim().is_empty() && params.user_prompt.trim().is_empty() {
        return error_response("At least one of system_prompt or user_prompt must be provided");
    }

    // Create AI client using ai.rs library
    let client = match create_ai_client(&params.api_key).await {
        Ok(client) => client,
        Err(e) => return error_response(&format!("Failed to create AI client: {}", e)),
    };

    // Create streaming request using ai.rs
    let request = match ChatCompletionRequestBuilder::default()
        .model("deepseek-chat")
        .messages(vec![
            ChatCompletionMessage::User(params.user_prompt.into()),
            ChatCompletionMessage::System(params.system_prompt.into()),
        ])
        .max_completion_tokens(params.max_tokens.unwrap_or(4000))
        .temperature(params.temperature.unwrap_or(0.7))
        .stream(true)
        .build()
    {
        Ok(req) => req,
        Err(e) => return error_response(&format!("Failed to build request: {}", e)),
    };

    // Send streaming request
    match client.stream_chat_completions(&request).await {
        Ok(mut stream) => {
            let mut full_content = String::new();
            let mut chunk_count = 0;
            let start_time = std::time::Instant::now();

            // Emit starting event
            emit_status(&handle, "streaming_started", "Waiting for response...").await;

            while let Some(chunk_result) = stream.next().await {
                // Check for timeout
                if start_time.elapsed().as_secs() > 5 * 60 {
                    return timeout_error(&handle).await;
                }

                let chunk = match chunk_result {
                    Ok(chunk) => chunk,
                    Err(e) => {
                        log::error!("Error reading stream chunk: {}", e);
                        return InvokeResponse::fail(format!("Stream error: {}", e));
                    }
                };

                chunk_count += 1;

                // Extract content from ai.rs chunk
                if !chunk.choices.is_empty() {
                    if let Some(content) = &chunk.choices[0].delta.content {
                        // Emit chunk to frontend
                        emit_chunk(&handle, content).await;
                        full_content.push_str(content);
                    }
                }

                // Log usage if available
                if chunk.usage.is_some() {
                    log::info!("Usage: {:#?}", chunk.usage.unwrap());
                }
            }

            // Complete streaming
            complete_streaming(&handle, chunk_count).await;
            InvokeResponse::success(full_content)
        }
        Err(e) => error_response(&format!("Request failed: {}", e)),
    }
}

// Helper function to create AI client
async fn create_ai_client(api_key: &str) -> Result<Client> {
    // Create client with custom base URL for DeepSeek
    let client = Client::from_url(api_key, "https://api.deepseek.com/v1")?;
    Ok(client)
}

// Helper function to handle error response
fn error_response(message: &str) -> InvokeResponse<String> {
    log::error!("{}", message);
    InvokeResponse::fail(message.to_string())
}

// Emit progress or status to frontend
async fn emit_status(handle: &AppHandle, status: &str, message: &str) {
    let _ = handle.emit(
        "chat_stream_chunk",
        StreamChunk {
            content: "".to_string(),
            is_complete: false,
            error: None,
            status: Some(status.to_string()),
            message: Some(message.to_string()),
        },
    );
}

// Emit a chunk of data to frontend
async fn emit_chunk(handle: &AppHandle, content: &str) {
    let _ = handle.emit(
        "chat_stream_chunk",
        StreamChunk {
            content: content.to_string(),
            is_complete: false,
            error: None,
            status: None,
            message: None,
        },
    );
}

// Handle timeout error
async fn timeout_error(handle: &AppHandle) -> InvokeResponse<String> {
    log::warn!("Streaming timeout after 5 minutes");
    let _ = handle.emit(
        "chat_stream_chunk",
        StreamChunk {
            content: "".to_string(),
            is_complete: true,
            error: Some("Streaming timeout after 5 minutes".to_string()),
            status: None,
            message: None,
        },
    );
    InvokeResponse::fail("Streaming timeout after 5 minutes".to_string())
}

// Handle streaming completion
async fn complete_streaming(handle: &AppHandle, chunk_count: usize) -> InvokeResponse<String> {
    log::info!("Stream completed after {} chunks", chunk_count);
    let _ = handle.emit(
        "chat_stream_chunk",
        StreamChunk {
            content: "".to_string(),
            is_complete: true,
            error: None,
            status: Some("completed".to_string()),
            message: Some("Streaming completed successfully".to_string()),
        },
    );
    InvokeResponse::success("Streaming completed successfully".to_string())
}
