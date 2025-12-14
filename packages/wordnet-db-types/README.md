# @repo/wordnet-db-types

TypeScript declarations for the [`wordnet-db`](https://www.npmjs.com/package/wordnet-db) package. Install alongside
`wordnet-db` and reference it from any project that needs typed access to the WordNet file manifest.

## Usage

```sh
bun add wordnet-db @repo/wordnet-db-types
```

Create a local declaration file (for example `src/types/wordnet-db.d.ts`) so TypeScript picks up the ambient module:

```ts
/// <reference types="@repo/wordnet-db-types" />
```

With the dependency installed and referenced, importing `wordnet-db` exposes typed metadata:

```ts
import wordnetDb from 'wordnet-db';

wordnetDb.path; // string
wordnetDb.files; // tuple of known files
```

## Publishing

This package contains only declaration files, so publishing is as simple as bumping the version and running your
standard `bun publish` (or npm equivalent).
