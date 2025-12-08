# @repo/config-builder

This package provides a utility for creating and validating a type-safe repository configuration. It uses `zod` for schema validation and `dotenv` to load environment variables from `.env` files.

## Usage

The primary export is the `createConfig` function, which builds the configuration object.

```typescript
import { createConfig, type RepoConfig } from '@repo/config-builder';

// Create a configuration object.
// It will be automatically populated with values based on the current NODE_ENV.
const config: RepoConfig = createConfig();

console.log(config.nodeEnv);

// You can also provide overrides
const testConfig = createConfig({
  nodeEnv: {
    env: 'test'
  }
});

console.log(testConfig.nodeEnv.isTesting); // true
```

## Configuration Loading

The `createConfig` utility loads configuration from environment variables and `.env` files in a specific, multi-tier precedence order:

1.  **Environment Variables (Highest Precedence)**: Any variables already set in the shell environment (e.g., via `export MY_VAR=value`) take precedence over all `.env` files.
2.  **`@repo/config-builder` Package Root**:
    *   `packages/config-builder/.env.<NODE_ENV>` (e.g., `packages/config-builder/.env.development`)
    *   `packages/config-builder/.env`
3.  **Current Application/Package Root**: The directory where the `bun` command is executed (e.g., `apps/cli/`).
    *   `./.env.<NODE_ENV>` (e.g., `apps/cli/.env.development`)
    *   `./.env`
4.  **Monorepo Root (Lowest Precedence)**: The top-level directory of the entire monorepo.
    *   `./.env.<NODE_ENV>` (e.g., `./.env.development`)
    *   `./.env`

The `dotenv` library loads files in the order listed above. For any given variable, the value from the **first file in the list** where it is defined will be used. Variables set by your shell environment always take the highest precedence.

The `NODE_ENV` defaults to `development` if not set, influencing which `.env.<NODE_ENV>` files are sought.
## Exports

This package exports the following members:

-   `createConfig`: The main function used to build the configuration object.
-   `RepoConfig`: The TypeScript type for the configuration object.
-   `RepoConfigSchema`: The Zod schema used to validate the configuration.
-   `NodeEnv`: An enum for the possible Node.js environments (`development`, `test`, `production`).
-   `nodeEnvs`: An array of the possible `NodeEnv` values.
