# CLI Refactoring Summary

This document summarizes the architectural refactoring to create a shared CLI helper package and the current status of the project.

## What Has Been Completed

- **New `@repo/cli-helper` Package**:
  - A new package, `@repo/cli-helper`, has been created to hold reusable CLI logic.
  - Core utilities like `registerCommand`, `CliOutputService`, and a (now removed) `createCliContainer` were moved into this package.

- **`@apps/cli` Refactoring**:
  - The main CLI application has been updated to use the new `@repo/cli-helper` package.

- **`@apps/wordnet-dict-api` Scaffolding**:
  - A new application has been set up with a `package.json`, `README.md`, and a placeholder `src/index.ts`.
  - A new `src/cli.ts` entry point has been created, which uses `@repo/cli-helper`, preparing it to have its own set of commands.

## What Still Needs to Be Done

The `bun validate` command is currently **failing** due to a cascade of errors from the refactoring. The following fixes are required to get the project back to a healthy state.

- **1. Fix Type-Checking Errors (High Priority)**:
  - **Problem**: There are multiple type errors across `@repo/cli`, `@repo/cli-helper`, and `@repo/wordnet-dict-api` related to incorrect imports, missing dependencies, and a flawed DI container setup.
  - **Action**: Systematically fix the dependency graph and container logic as outlined below.

- **2. Correct Architectural Flaws (High Priority)**:
  - **Problem**: The initial refactoring made several incorrect assumptions:
    - It created a confusing re-export of `@repo/shared-types` from `@repo/config-builder`.
    - It exported the CLI-only `AppDataSource` for general use.
    - It created a premature `createCliContainer` abstraction in the wrong package.
  - **Action**: The architecture will be refactored to be cleaner and more aligned with standard practices.

- **3. Fix Project Conventions (Medium Priority)**:
  - **Problem**: A test file was created in the wrong directory, and `.tsbuildinfo` files are not ignored by git.
  - **Action**: Move the test file and update the root `.gitignore`.
