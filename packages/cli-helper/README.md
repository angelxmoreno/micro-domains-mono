# @repo/cli-helper

This package provides a foundational framework for building Command Line Interface (CLI) applications using `commander.js` for command parsing and `tsyringe` for dependency injection. It aims to streamline the development of structured, testable, and maintainable CLI tools within a monorepo environment.

## Features

*   **CLI Application Bootstrapping**: Easily set up and configure your CLI application with `CliApp`.
*   **Command Registration**: Register individual commands with arguments, options, and descriptions.
*   **Dependency Injection Integration**: Seamlessly integrate `tsyringe` to manage dependencies within your commands.
*   **Typed Commands**: Leverage TypeScript to create type-safe command definitions and action functions.
*   **Logging and Output Services**: Standardized services for logging debug information and displaying command output.

## Installation

```bash
bun add @repo/cli-helper
# or npm install @repo/cli-helper
# or yarn add @repo/cli-helper
```

## Usage

### 1. Main CLI Entry Point (e.g., `apps/cli/src/index.ts`)

Initialize your `CliApp` and register your commands.

```typescript
import { CliApp, type CliAppParams } from '@repo/cli-helper';
import { appContainer } from './config'; // Your pre-configured tsyringe container
import { helloProgram } from './commands/HelloCommand';
import { dictImportProgram } from './commands/DictImportCommand';
import { anotherNewCommand } from './commands/AnotherNewCommand'; // Assume this is your new command

const cliParams: CliAppParams = {
    name: 'my-cli-app',
    description: 'A custom CLI application',
    version: '1.0.0',
    container: appContainer, // Pass your dependency container
    commands: [helloProgram, dictImportProgram, anotherNewCommand], // Add your new command here
};

const cliApp = new CliApp(cliParams);
cliApp.init().start();
```

### 2. Command Definition (e.g., `apps/cli/src/commands/HelloCommand.ts`)

Define your commands using `createTypedCommand` and access injected dependencies.

```typescript
import { CliLogger, CliOutputService, createTypedCommand, type TypedActionFunction } from '@repo/cli-helper';

export const helloAction: TypedActionFunction<[name?: string]> = async (name, options): Promise<void> => {
    const { container } = options;
    const finalName = name ?? 'World';

    // Resolve dependencies from the container
    const logger = container.resolve(CliLogger);
    const cliOutput = container.resolve(CliOutputService);

    logger.debug({ args: { name: finalName } }, 'Executing hello command');
    cliOutput.log(`Hello ${finalName}!`);
};

export const helloProgram = createTypedCommand(
    {
        command: 'hello',
        description: 'Says hello to a specified person',
        arguments: [
            {
                name: '[name]',
                description: 'The person to greet',
                defaultValue: 'World',
            },
        ],
    },
    helloAction
);
```

### 3. Dependency Configuration (e.g., `apps/cli/src/config.ts`)

Set up your `tsyringe` container and register services like `CliOutputService`.

```typescript
import { CliOutputService } from '@repo/cli-helper';
import { createConfig, createContainer } from '@repo/config-builder';
// ... other imports for your specific services

const appConfig = createConfig(); // If you have a config-builder package
const appContainer = createContainer(appConfig);

// Register CliOutputService instance
appContainer.registerInstance(CliOutputService, new CliOutputService());
// You might register other services here, e.g., database connections, API clients.

export { appContainer, appConfig };
```

## API Reference

The main exports from `@repo/cli-helper` include:

*   `CliApp`: The core class for initializing and running the CLI.
*   `CliLogger`: An `InjectionToken` for the Pino logger instance managed by `CliApp`.
*   `CliOutputService`: A simple service for abstracting console output.
*   `AppCommand`: Interface describing the structure of a CLI command.
*   `createTypedCommand`: A helper function to create type-safe command definitions.
*   `TypedActionFunction`: A type for command action functions, including access to the dependency container.
*   `registerCommand`: Internal utility to register commands with a `commander` program.
