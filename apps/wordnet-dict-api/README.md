# @repo/wordnet-dict-api

This is a dictionary microservice that provides fast and structured access to WordNet data. It is designed to be a central dictionary API for other services, keeping linguistic data separate while optimizing performance.

## Tech Stack

-   **Runtime**: Bun
-   **Web Framework**: Hono
-   **ORM / DB**: Drizzle ORM + Bun's native SQLite (`bun:sqlite`)
-   **Containerization**: Docker

## Getting Started

To install dependencies and get the server running:

```sh
# From the monorepo root
bun install

# Run the development server
turbo run dev --filter=@repo/wordnet-dict-api
```

The development server will be available at `http://localhost:3000`.

## API Endpoints

The service will expose the following REST endpoints for querying data:

-   `GET /define?word=<word>`: Returns definitions.
-   `GET /synonyms?word=<word>`: Returns synonyms.
-   `GET /antonyms?word=<word>`: Returns antonyms.
-   `GET /pos?word=<word>`: Returns part of speech.

All responses are in JSON format.
## Environment

- `DB_PATH` (optional): absolute path to the SQLite database file. Defaults to `<repo>/apps/wordnet-dict-api/wordnet.sqlite` when unset.
