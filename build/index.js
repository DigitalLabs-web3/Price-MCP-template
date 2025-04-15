#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Core SDK imports
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
// Types and schemas
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const types_js_2 = require("@modelcontextprotocol/sdk/types.js");
const types_js_3 = require("@modelcontextprotocol/sdk/types.js");
// Third-party imports
const axios_1 = __importDefault(require("axios"));
class OKXServer {
    server;
    axiosInstance;
    constructor() {
        console.error('[Setup] Initializing OKX MCP server...');
        this.server = new index_js_1.Server({
            name: 'okx-mcp-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.axiosInstance = axios_1.default.create({
            baseURL: 'https://www.okx.com/api/v5',
            timeout: 5000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        // Initialize tool handlers here
        // Example: this.server.addTool('toolName', this.handleTool.bind(this));
        this.server.setRequestHandler(types_js_3.ListToolsRequestSchema, async (request) => {
            return {
                tools: [
                    {
                        name: 'get_price',
                        description: 'Get latest price for an OKX instrument',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                instrument: {
                                    type: 'string',
                                    description: 'Instrument ID (e.g. BTC-USDT)',
                                },
                            },
                            required: ['instrument'],
                        },
                    }
                ]
            };
        });
        this.server.setRequestHandler(types_js_3.CallToolRequestSchema, async (request) => {
            try {
                if (!['get_price', 'get_candlesticks'].includes(request.params.name)) {
                    throw new types_js_1.McpError(types_js_2.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
                const args = request.params.arguments;
                if (!args.instrument) {
                    throw new types_js_1.McpError(types_js_2.ErrorCode.InvalidParams, 'Missing required parameter: instrument');
                }
                if (request.params.name === 'get_price') {
                    console.log(`[API] Fetching price for instrument: ${args.instrument}`);
                    const response = await this.axiosInstance.get('/market/ticker', {
                        params: { instId: args.instrument },
                    });
                    if (response.data.code !== '0') {
                        throw new Error(`OKX API error: ${response.data.msg}`);
                    }
                    if (!response.data.data || response.data.data.length === 0) {
                        throw new Error('No data returned from OKX API');
                    }
                    const ticker = response.data.data[0];
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    instrument: ticker.instId,
                                    lastPrice: ticker.last,
                                    bid: ticker.bidPx,
                                    ask: ticker.askPx,
                                    high24h: ticker.high24h,
                                    low24h: ticker.low24h,
                                    volume24h: ticker.vol24h,
                                    timestamp: new Date(parseInt(ticker.ts)).toISOString(),
                                }, null, 2),
                            },
                        ],
                    };
                }
                return { result: 'success' };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error('[Error] Failed to fetch data:', error);
                    throw new types_js_1.McpError(types_js_2.ErrorCode.InternalError, `Failed to fetch data: ${error.message}`);
                }
                throw error;
            }
        });
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.log('OKX MCP server running on stdio');
    }
}
const server = new OKXServer();
server.run().catch(console.error);
