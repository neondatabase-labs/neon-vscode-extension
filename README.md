# Neon VSCode Extension

A Visual Studio Code extension for interacting with [Neon](https://neon.tech) - the serverless Postgres database.

## Features

- Sign in to your Neon account directly from VS Code
- OAuth-based authentication flow
- Simple and intuitive UI

## Requirements

- Visual Studio Code 1.60.0 or higher

## Installation

You can install this extension directly from the VS Code Marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Neon"
4. Click Install

## Usage

1. Click on the Neon icon in the Activity Bar
2. Click "Sign in with Neon" to authenticate
3. After successful authentication, you'll see a welcome message

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/neon-vscode-extension.git
cd neon-vscode-extension

# Install dependencies
npm install

# Compile the extension
npm run compile
```

### Running the Extension

- Press F5 to open a new window with your extension loaded
- Set breakpoints in your code inside `src/extension.ts` to debug
- Find output from your extension in the debug console

### Building the Extension

```bash
npm run package
```

This will create a `.vsix` file that you can install in VS Code.

## License

ISC 