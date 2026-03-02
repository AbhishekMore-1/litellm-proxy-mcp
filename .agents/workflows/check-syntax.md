---
description: Test the LiteLLM MCP Server syntax and basic execution
---
# Test the LiteLLM MCP Server

This workflow lets you verify that the `litellm-mcp-server.js` has no syntax errors and can start up properly without crashing.

1. Ensure dependencies are installed
// turbo
```bash
npm install
```

2. Run a syntax check on the server file
// turbo
```bash
node -c litellm-mcp-server.js
```
