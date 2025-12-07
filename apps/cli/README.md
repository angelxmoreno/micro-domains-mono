# @repo/cli

A command-line interface for the project.

This CLI is built with `commander` and `pino` for robust command handling and structured logging.

## Usage

You can run the CLI from the monorepo root. The arguments are passed to the CLI after the `--` separator.

```sh
# See all commands
bun cli --help

# Run the 'hello' command
bun cli hello

# Run the 'hello' command with a name
bun cli hello "John Doe"
```

## Available Commands

### `hello`

Says hello to the specified person.

-   **Usage**: `bun cli hello [name]`
-   **Arguments**:
    -   `[name]`: The person to greet. Defaults to "World".

## Development

The CLI is designed to be easily extensible with type-safe commands.

### Adding a New Command

1.  **Create a Command File**: Create a new file in the `src/commands/` directory (e.g., `src/commands/NewCommand.ts`).
2.  **Define the Action**: Create a `TypedActionFunction` that contains the logic for your command.
3.  **Define the Command**: Use the `createTypedCommand` helper to define your command's name, description, arguments, and options, and pass your action function to it. This ensures the arguments passed to your action are type-safe.
4.  **Register the Command**: Import your new command definition into `src/index.ts` and register it using the `registerCommand` function.

This structure ensures that all commands are consistently defined and that the core logic in `index.ts` rarely needs to be changed.

## Scripts

-   `bun dev`: Run the CLI in development mode.
-   `bun build`: Build the CLI for production.
-   `bun start`: Run the production build.
-   `bun test`: Run unit tests.
-   `bun lint`: Lint the code.
-   `bun check-types`: Check for TypeScript errors.
