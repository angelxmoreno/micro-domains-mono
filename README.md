# MicroDomains MonoRepo

This monorepo is for a web service for buying short domain names.

## Packages

This monorepo includes the following packages:

-   `@repo/cli`: A command-line interface for the project.
-   `@repo/config-builder`: A utility for creating and validating repository configuration.
-   `@repo/typescript-config`: Shared TypeScript configurations.

## Usage

To install dependencies, run the following command from the root of the monorepo:

```sh
bun install
```

To start the development server, run:

```sh
bun dev
```

## Linting & Formatting

To lint the code, run:

```sh
bun lint
```

To format the code, run:

```sh
bun format
```

## Environment Configuration

This monorepo uses `.env` files to manage environment-specific variables. The `createConfig` utility, provided by the `@repo/config-builder` package, handles the loading of these variables with a specific order of precedence across the monorepo.

For detailed information on `.env` file locations and their loading priority, please refer to the documentation in the [`@repo/config-builder` package's README](/packages/config-builder/README.md).
