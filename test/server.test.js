import test from 'node:test';
import assert from 'node:assert';
import { server } from '../litellm-mcp-server.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

test('LiteLLM MCP Server Toolkit', async (t) => {
    await t.test('server starts and has correct name and version', () => {
        assert.strictEqual(server._serverInfo.name, 'litellm-mcp-server');
        assert.strictEqual(server._serverInfo.version, '1.0.0');
    });

    await t.test('registers expected litellm tools', async () => {
        // simulate a tool list request
        const request = {
            method: 'tools/list',
            params: {}
        };

        // use the request handler we registered for ListTools
        // to bypass needing a real transport connection for unit tests
        const handler = server._requestHandlers.get('tools/list');
        const response = await handler(request);

        assert.ok(response.tools, 'Response should contain a tools array');

        const toolNames = response.tools.map(tool => tool.name);
        const expectedTools = [
            'chat_completion',
            'completion',
            'list_models',
            'health_check',
            'create_embedding',
            'model_info',
            'create_image',
            'create_speech',
            'rerank',
            'key_generate',
            'key_info'
        ];

        for (const expected of expectedTools) {
            assert.ok(toolNames.includes(expected), `Tool ${expected} is registered`);
        }
    });
});
