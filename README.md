# MicroDomains MonoRepo

This monorepo is for a web service for buying short domain names.

## Packages

This monorepo includes the following packages:

-   `@apps/cli`: A command-line interface for the project.
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
