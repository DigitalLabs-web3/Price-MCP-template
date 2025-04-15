# OKX MCP Server

A Model Context Protocol (MCP) server implementation that provides real-time access to OKX cryptocurrency exchange data. This server enables AI language models to fetch current cryptocurrency prices and market data directly from OKX.

## Features

- Real-time cryptocurrency price data from OKX exchange
- Implements MCP protocol for seamless integration with AI models
- Supports multiple trading pairs (instruments)
- Clean error handling and logging
- Built with TypeScript for type safety

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Access to OKX's public API endpoints

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd okx-mcp-server
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

The server runs on stdio, making it compatible with MCP-enabled AI models.

## Available Tools

### get_price

Fetches the latest price and market data for a specified trading instrument.

**Parameters:**
- `instrument` (string, required): Trading pair identifier (e.g., "BTC-USDT")

**Response Example:**
```json
{
  "instrument": "BTC-USDT",
  "lastPrice": "50000.00",
  "bid": "49999.00",
  "ask": "50001.00",
  "high24h": "51000.00",
  "low24h": "49000.00",
  "volume24h": "1000.00",
  "timestamp": "2024-03-21T12:00:00.000Z"
}
```

## Error Handling

The server implements standard MCP error codes:
- `MethodNotFound`: When an unsupported tool is requested
- `InvalidParams`: When required parameters are missing
- `InternalError`: For API communication errors or internal server issues

## Development

The server is built using the following technologies:
- TypeScript
- @modelcontextprotocol/sdk
- axios for API communication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license information here]

## Acknowledgments

- Built with the Model Context Protocol (MCP) SDK
- Uses OKX's public API for market data
