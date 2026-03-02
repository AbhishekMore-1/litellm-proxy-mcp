# LiteLLM MCP Server Bridge

A Model Context Protocol (MCP) server that connects Antigravity to your deployed LiteLLM instance.

## Features

This MCP server provides the following tools:

- **chat_completion** - Generate chat completions using any model in your LiteLLM instance
- **completion** - Generate text completions using the legacy endpoint
- **list_models** - List all available models
- **health_check** - Check LiteLLM instance health status
- **create_embedding** - Generate embeddings
- **model_info** - Get detailed information about a specific model
- **create_image** - Generate images using models available in your instance
- **create_speech** - Generate speech audio from text (TTS)
- **rerank** - Rerank documents based on a search query
- **key_generate** - Generate a new LiteLLM Proxy API key (admin feature)
- **key_info** - Get details and spend info for a LiteLLM Proxy API key (admin feature)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Antigravity

Add the following to your Antigravity MCP configuration:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "litellm": {
      "command": "node",
      "args": ["/path-to-script/litellm-mcp-server.js"],
      "env": {
        "LITELLM_BASE_URL": "https://your-litellm-url",
        "LITELLM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Important:** Replace `/path-to-script/litellm-mcp-server.js` with the absolute path to where you saved the script.

### 3. Set Your API Key

Replace `your-api-key-here` in the configuration with your actual LiteLLM API key.

## Usage Examples

Once configured, you can use the MCP tools in Antigravity:

### Chat Completion

```
Use the chat_completion tool to generate a response using gpt-4
```

### List Models

```
Use the list_models tool to see what models are available
```

### Health Check

```
Use the health_check tool to verify the LiteLLM instance is running
```

## Environment Variables

- `LITELLM_BASE_URL` - Your LiteLLM instance URL
- `LITELLM_API_KEY` - Your LiteLLM API key for authentication

## Troubleshooting

### Server won't start

1. Ensure Node.js is installed: `node --version`
2. Check dependencies are installed: `npm install`
3. Verify the script path in your Antigravity config is correct
4. Check that your API key is valid

### Connection errors

1. Verify your LiteLLM instance is accessible: `curl https://your-litellm-url/health`
2. Check your API key has proper permissions
3. Ensure your network allows connections to the LiteLLM instance

### Tool not showing up

1. Restart Antigravity after adding the MCP server configuration
2. Check Antigravity logs for any error messages
3. Verify the JSON configuration is valid

## Architecture

The MCP server acts as a bridge:

```
Antigravity ←→ MCP Server (this script) ←→ LiteLLM Instance
```

All requests from Antigravity are forwarded to your LiteLLM instance with proper authentication headers.

## License

MIT