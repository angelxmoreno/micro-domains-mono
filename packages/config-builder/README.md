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

The `createConfig` utility loads configuration from environment variables and `.env` files in a specific order:

1.  **Environment-specific file**: It first tries to load a file based on the current `NODE_ENV` (e.g., `.env.development`, `.env.test`).
2.  **Default file**: It falls back to a root `.env` file if no environment-specific file is found.

The `NODE_ENV` defaults to `development` if not set.

## Exports

This package exports the following members:

-   `createConfig`: The main function used to build the configuration object.
-   `RepoConfig`: The TypeScript type for the configuration object.
-   `RepoConfigSchema`: The Zod schema used to validate the configuration.
-   `NodeEnv`: An enum for the possible Node.js environments (`development`, `test`, `production`).
-   `nodeEnvs`: An array of the possible `NodeEnv` values.
