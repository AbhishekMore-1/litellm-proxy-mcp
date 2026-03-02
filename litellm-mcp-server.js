#!/usr/bin/env node

/**
 * LiteLLM MCP Server Bridge
 * Connects Antigravity MCP to a deployed LiteLLM instance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Configuration from environment variables
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || '';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || '';

// Utility function to make requests to LiteLLM
async function makeLiteLLMRequest(endpoint, method = 'GET', body = null) {
    const url = `${LITELLM_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LITELLM_API_KEY}`,
    };

    const options = {
        method,
        headers,
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LiteLLM API error (${response.status}): ${errorText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType.includes('audio/') || contentType.includes('image/')) {
            const arrayBuffer = await response.arrayBuffer();
            return {
                _binary: true,
                contentType,
                base64: Buffer.from(arrayBuffer).toString('base64')
            };
        } else {
            return await response.text();
        }
    } catch (error) {
        throw new Error(`Failed to connect to LiteLLM: ${error.message}`);
    }
}

// Create MCP server instance
const server = new Server(
    {
        name: 'litellm-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'chat_completion',
                description: 'Generate chat completions using LiteLLM. Supports all models available in your LiteLLM instance.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        model: {
                            type: 'string',
                            description: 'The model to use (e.g., gpt-4, claude-3-opus, etc.)',
                        },
                        messages: {
                            type: 'array',
                            description: 'Array of message objects with role and content',
                            items: {
                                type: 'object',
                                properties: {
                                    role: {
                                        type: 'string',
                                        enum: ['system', 'user', 'assistant'],
                                    },
                                    content: {
                                        type: 'string',
                                    },
                                },
                                required: ['role', 'content'],
                            },
                        },
                        temperature: {
                            type: 'number',
                            description: 'Sampling temperature (0-2)',
                            default: 1,
                        },
                        max_tokens: {
                            type: 'number',
                            description: 'Maximum tokens to generate',
                        },
                        top_p: {
                            type: 'number',
                            description: 'Nucleus sampling parameter',
                        },
                        stream: {
                            type: 'boolean',
                            description: 'Whether to stream the response',
                            default: false,
                        },
                    },
                    required: ['model', 'messages'],
                },
            },
            {
                name: 'completion',
                description: 'Generate text completions (legacy endpoint) using LiteLLM.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        model: {
                            type: 'string',
                            description: 'The model to use',
                        },
                        prompt: {
                            type: 'string',
                            description: 'The prompt to generate completions for',
                        },
                        temperature: {
                            type: 'number',
                            description: 'Sampling temperature (0-2)',
                            default: 1,
                        },
                        max_tokens: {
                            type: 'number',
                            description: 'Maximum tokens to generate',
                        },
                        stream: {
                            type: 'boolean',
                            description: 'Whether to stream the response',
                            default: false,
                        },
                    },
                    required: ['model', 'prompt'],
                },
            },
            {
                name: 'list_models',
                description: 'List all available models from your LiteLLM instance',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'health_check',
                description: 'Check the health status of your LiteLLM instance',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'create_embedding',
                description: 'Generate embeddings using LiteLLM',
                inputSchema: {
                    type: 'object',
                    properties: {
                        model: {
                            type: 'string',
                            description: 'The embedding model to use (e.g., text-embedding-ada-002)',
                        },
                        input: {
                            type: ['string', 'array'],
                            description: 'Text or array of texts to embed',
                        },
                    },
                    required: ['model', 'input'],
                },
            },
            {
                name: 'model_info',
                description: 'Get detailed information about a specific model',
                inputSchema: {
                    type: 'object',
                    properties: {
                        model: {
                            type: 'string',
                            description: 'The model name to get information about',
                        },
                    },
                    required: ['model'],
                },
            },
            {
                name: 'create_image',
                description: 'Generate images using LiteLLM (/images/generations)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: {
                            type: 'string',
                            description: 'A text description of the desired image(s).',
                        },
                        model: {
                            type: 'string',
                            description: 'The model to use for image generation.',
                        },
                        n: {
                            type: 'number',
                            description: 'The number of images to generate.',
                            default: 1,
                        },
                        size: {
                            type: 'string',
                            description: 'The size of the generated images. (e.g. 1024x1024)',
                            default: '1024x1024',
                        },
                    },
                    required: ['prompt'],
                },
            },
            {
                name: 'create_speech',
                description: 'Generate speech audio from text using LiteLLM (/audio/speech)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        model: {
                            type: 'string',
                            description: 'The model to use for speech generation (e.g., tts-1).',
                        },
                        input: {
                            type: 'string',
                            description: 'The text to generate audio for.',
                        },
                        voice: {
                            type: 'string',
                            description: 'The voice to use for generation (e.g., alloy, echo, fable).',
                            default: 'alloy',
                        },
                    },
                    required: ['model', 'input', 'voice'],
                },
            },
            {
                name: 'rerank',
                description: 'Rerank documents based on a query using LiteLLM (/rerank)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        model: {
                            type: 'string',
                            description: 'The model to use for reranking.',
                        },
                        query: {
                            type: 'string',
                            description: 'The search query.',
                        },
                        documents: {
                            type: 'array',
                            description: 'A list of document texts to rerank.',
                            items: { type: 'string' },
                        },
                        top_n: {
                            type: 'number',
                            description: 'The number of top documents to return.',
                        },
                    },
                    required: ['model', 'query', 'documents'],
                },
            },
            {
                name: 'key_generate',
                description: 'Generate a new LiteLLM Proxy API key (/key/generate)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        models: {
                            type: 'array',
                            description: 'List of models the key is allowed to access',
                            items: { type: 'string' },
                        },
                        duration: {
                            type: 'string',
                            description: 'Duration for the key to remain valid (e.g., 1h, 30d)',
                        },
                        max_budget: {
                            type: 'number',
                            description: 'Maximum spend budget in USD',
                        },
                        team_id: {
                            type: 'string',
                            description: 'Optional Team ID to associate with the key',
                        },
                        metadata: {
                            type: 'object',
                            description: 'Any additional metadata to store with the key',
                        },
                    },
                },
            },
            {
                name: 'key_info',
                description: 'Get details and spend info for a LiteLLM Proxy API key (/key/info)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        key: {
                            type: 'string',
                            description: 'The virtual key to look up. If omitted, info for the current proxy API key is returned.',
                        },
                    },
                },
            },
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'chat_completion': {
                const { model, messages, temperature, max_tokens, top_p, stream } = args;
                const requestBody = {
                    model, messages,
                    ...(temperature !== undefined && { temperature }),
                    ...(max_tokens !== undefined && { max_tokens }),
                    ...(top_p !== undefined && { top_p }),
                    ...(stream !== undefined && { stream }),
                };
                const response = await makeLiteLLMRequest('/chat/completions', 'POST', requestBody);
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'completion': {
                const { model, prompt, temperature, max_tokens, stream } = args;
                const requestBody = {
                    model, prompt,
                    ...(temperature !== undefined && { temperature }),
                    ...(max_tokens !== undefined && { max_tokens }),
                    ...(stream !== undefined && { stream }),
                };
                const response = await makeLiteLLMRequest('/completions', 'POST', requestBody);
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'list_models': {
                const response = await makeLiteLLMRequest('/models', 'GET');
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'health_check': {
                const response = await makeLiteLLMRequest('/health', 'GET');
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'create_embedding': {
                const { model, input } = args;
                const requestBody = { model, input };
                const response = await makeLiteLLMRequest('/embeddings', 'POST', requestBody);
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'model_info': {
                const { model } = args;
                const response = await makeLiteLLMRequest(`/model/info?model=${encodeURIComponent(model)}`, 'GET');
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'create_image': {
                const { prompt, model, n, size } = args;
                const requestBody = {
                    prompt,
                    ...(model !== undefined && { model }),
                    ...(n !== undefined && { n }),
                    ...(size !== undefined && { size }),
                };
                const response = await makeLiteLLMRequest('/images/generations', 'POST', requestBody);
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'create_speech': {
                const { model, input, voice } = args;
                const requestBody = { model, input, voice };
                const response = await makeLiteLLMRequest('/audio/speech', 'POST', requestBody);
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'rerank': {
                const { model, query, documents, top_n } = args;
                const requestBody = {
                    model, query, documents,
                    ...(top_n !== undefined && { top_n }),
                };
                const response = await makeLiteLLMRequest('/rerank', 'POST', requestBody);
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'key_generate': {
                const requestBody = {};
                for (const [k, v] of Object.entries(args)) {
                    if (v !== undefined) requestBody[k] = v;
                }
                const response = await makeLiteLLMRequest('/key/generate', 'POST', requestBody);
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            case 'key_info': {
                let endpoint = '/key/info';
                if (args && args.key) {
                    endpoint += `?key=${encodeURIComponent(args.key)}`;
                }
                const response = await makeLiteLLMRequest(endpoint, 'GET');
                return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [{ type: 'text', text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

// Export server for testing
export { server };

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('LiteLLM MCP Server running on stdio');
}

import { fileURLToPath } from 'url';
import fs from 'fs';

const isMainModule = () => {
    if (!process.argv[1]) return false;
    try {
        const scriptPath = fs.realpathSync(process.argv[1]);
        const modulePath = fileURLToPath(import.meta.url);
        return scriptPath === modulePath;
    } catch {
        return false;
    }
};

if (isMainModule()) {
    main().catch((error) => {
        console.error('Fatal error in main():', error);
        process.exit(1);
    });
}