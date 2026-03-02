# Antigravity AI Agent Instructions

Welcome to the `litellm-proxy-mcp` project. This document provides instructions for AI coding assistants (like Antigravity) working in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server written in Node.js (`litellm-mcp-server.js`). It connects an MCP client (such as Antigravity or Claude Desktop) to a deployed LiteLLM proxy instance.

- **Primary Language:** JavaScript (Node.js)
- **Architecture:** 
  - Uses `@modelcontextprotocol/sdk` to define the MCP `Server` and capabilities.
  - Communicates via `stdio` transport.
  - Forwards `CallTool` requests to the configured `LITELLM_BASE_URL` using native `fetch`.

## Available Tools

The server currently implements the following tools, mapping directly to LiteLLM Proxy endpoints:
- `chat_completion` (`/chat/completions`)
- `completion` (`/completions`)
- `list_models` (`/models`)
- `health_check` (`/health`)
- `create_embedding` (`/embeddings`)
- `model_info` (`/model/info`)
- `create_image` (`/images/generations`)
- `create_speech` (`/audio/speech`)
- `rerank` (`/rerank`)
- `key_generate` (`/key/generate`)
- `key_info` (`/key/info`)

## Development Guidelines

1. **Single File Approach:** The core logic is intentionally kept in `litellm-mcp-server.js` for simplicity.
2. **Error Handling:** Ensure that errors from the LiteLLM API are caught and returned clearly within the MCP tool execution response (`isError: true`).
3. **No External Fetch Libraries:** We use native Node.js `fetch` (requires Node 18+). Do not install `axios` or `node-fetch`.
4. **Binary Data Handling:** Some LiteLLM endpoints (like `/audio/speech`) return binary data (e.g., MP3 audio) or images. The `makeLiteLLMRequest` function is designed to convert `audio/*` and `image/*` responses into Base64 encoded strings to pass over MCP.

## Testing Locally

To check for syntax errors before committing changes:
```bash
node -c litellm-mcp-server.js
```

To run the server manually, you need to provide environment variables:
```bash
LITELLM_BASE_URL="https://your-litellm-url.com" LITELLM_API_KEY="sk-..." node litellm-mcp-server.js
```
