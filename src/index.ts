#!/usr/bin/env node

// Core SDK imports
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Types and schemas
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Third-party imports
import axios from 'axios';

// Types for OKX API responses
interface OKXTickerResponse {
    code: string;
    msg: string;
    data: Array<{
      instId: string;
      last: string;
      askPx: string;
      bidPx: string;
      open24h: string;
      high24h: string;
      low24h: string;
      volCcy24h: string;
      vol24h: string;
      ts: string;
    }>;
  }

class OKXServer {
    private server: Server;
    private axiosInstance;
  
    constructor() {
      console.error('[Setup] Initializing OKX MCP server...');
      
      this.server = new Server(
        {
          name: 'okx-mcp-server',
          version: '0.1.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
  
      this.axiosInstance = axios.create({
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

    private setupToolHandlers(): void {
      // Initialize tool handlers here
      // Example: this.server.addTool('toolName', this.handleTool.bind(this));
      this.server.setRequestHandler(
        ListToolsRequestSchema,
        async (request) => {
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
          }
        }
      )
      this.server.setRequestHandler(
        CallToolRequestSchema,
        async (request) => {    
            try {
                if (!['get_price', 'get_candlesticks'].includes(request.params.name)) {
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${request.params.name}`
                    );
                }

                const args = request.params.arguments as {
                    instrument: string;
                    bar?: string;
                    limit?: number;
                };

                if (!args.instrument) {
                    throw new McpError(
                        ErrorCode.InvalidParams,
                        'Missing required parameter: instrument'
                    );
                }

                if (request.params.name === 'get_price') {
                    console.log(`[API] Fetching price for instrument: ${args.instrument}`);
                    const response = await this.axiosInstance.get<OKXTickerResponse>(
                        '/market/ticker',
                        {
                            params: { instId: args.instrument },
                        }
                    );

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
            } catch (error) {
                if (error instanceof Error) {
                    console.error('[Error] Failed to fetch data:', error);
                    throw new McpError(
                        ErrorCode.InternalError,
                        `Failed to fetch data: ${error.message}`
                    );
                }
                throw error;
            }
        }
      )
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('OKX MCP server running on stdio');
      }
}

const server = new OKXServer();
server.run().catch(console.error);