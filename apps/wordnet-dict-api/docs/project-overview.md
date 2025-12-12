# WordNet Dictionary Service Architecture

## Project Overview

`wordnet-dict` (working name) is a **dictionary microservice** that provides fast and structured access to WordNet data. It is designed to be a central dictionary API for other services, keeping linguistic data separate while optimizing performance.

The service will:

* Download and parse **raw WordNet data files**.
* Store processed data in a **SQLite** database.
* Expose a **REST API** for querying definitions, synonyms, antonyms, and parts of speech.
* Use **Hono** (lightweight Bun-compatible web framework) for handling HTTP requests.
* Optimize database queries using **Bun** and **Drizzle ORM**.
* Be fully **dockerized** for easy deployment and integration.

## Goals

* **Separation of Concerns:** Keep dictionary data isolated for modularity.
* **High Performance:** Fast lookups using Bun + Drizzle + SQLite.
* **Extensible API:** Add endpoints for additional linguistic features with minimal effort.
* **Dockerized Service:** Easy deployment and orchestration alongside other services.

## Architecture Overview

```text
+-------------------+          +-------------------+          +----------------+
|   Other Service   |  <---->  | wordnet-dict API  |  <---->  |   SQLite DB    |
+-------------------+          +-------------------+          +----------------+
                                     |
                                     v
                          +-------------------+
                          | Raw WordNet Files |
                          +-------------------+
```

## Components

### WordNet Data Processor

* Downloads and parses **raw WordNet files**.
* Inserts structured data into **SQLite** using **Drizzle ORM**.
* Can run on initialization or via a manual update command.

### SQLite Database

* Stores **synsets, lemmas, definitions, relations, and parts of speech**.
* Optimized for **read-heavy queries**.
* Schema managed via **Drizzle ORM** for type safety and migrations.

### API Service

* Built using **Hono** on **Bun**.
* Exposes endpoints:

    * `GET /define?word=<word>` → Returns definitions.
    * `GET /synonyms?word=<word>` → Returns synonyms.
    * `GET /antonyms?word=<word>` → Returns antonyms.
    * `GET /pos?word=<word>` → Returns part of speech.
* Returns **JSON responses** for easy consumption by other services.

### Docker Container

* Packages the API service and database initialization logic.
* Supports configuration via **environment variables** (e.g., database path, cache size).
* Can be orchestrated with **Docker Compose** alongside other services.

## Technology Stack

| Layer            | Technology        |
| ---------------- | ----------------- |
| Runtime          | Bun               |
| Web Framework    | Hono              |
| ORM / DB         | Drizzle + SQLite  |
| Containerization | Docker            |
| API              | REST (JSON)       |
| Data Source      | Raw WordNet files |

## Future Enhancements

* Add a **caching layer** (e.g., Redis) for high-frequency queries.
* Support **bulk queries** for batch operations.
* Extend API to return **example sentences, hypernyms, hyponyms**, and other linguistic data.
* Add **authentication/authorization** for internal service use.
