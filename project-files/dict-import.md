# Importing Dictionaries

Here we document the technical plan for importing words from various sources into the project. The long-term vision is to use this rich dataset to suggest potential domain names based on word properties (e.g., "show me domain names with British English verbs").

## Technology Stack

-   **Language**: TypeScript
-   **Runtime**: Bun
-   **Database**: MySQL
-   **ORM / DB Client**: TypeORM

## Database Schema

We will use a single table to store words. Metadata fields that may not be available from all sources will be nullable. For this initial phase, we will focus on importing single words, with phrases to be handled separately in the future.

Here is the proposed schema using MySQL syntax:

```sql
CREATE TABLE `words` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL COMMENT 'The lowercase version of the word',
  `source` VARCHAR(255) NOT NULL COMMENT 'The origin source of the word (e.g., a URL or name)',
  `part_of_speech` VARCHAR(50) NULL COMMENT 'e.g., noun, verb, adjective',
  `origin` VARCHAR(100) NULL COMMENT 'The etymological origin, e.g., latin, greek',
  `location` VARCHAR(100) NULL COMMENT 'The regional usage, e.g., american, british',
  `definition` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Import Process / Workflow

The import script should be idempotent, meaning it can be run multiple times without creating duplicate entries.

The high-level workflow for a single source will be:

1.  **Initialize Importer**: Instantiate an importer class for the specific source (e.g., `DwylDictImporter`).
2.  **Fetch Data**: Download or read the raw data file(s) from the source.
3.  **Pre-process Data**: Use a source-specific pre-processor function to parse the raw file content into a structured array of objects containing the word and any available metadata.
4.  **Iterate and Insert**: Loop through each processed word.
    a.  Normalize the word (e.g., to lowercase, trim whitespace).
    b.  **Check for existence**: Query the `words` table to see if the normalized word already exists.
    c.  If it does not exist, insert a new record with the word and all its associated metadata.
    d.  If it *does* exist, skip it to avoid duplicates. (Future enhancement: update the existing record if the new source provides better metadata).
5.  **Log Results**: Log the results of the import run (e.g., number of new words added, errors encountered).

Error handling should be implemented for network failures or unexpected file formats.

## Import Sources

### GitHub Repositories

There are a few repositories with English word lists:

-   https://github.com/dwyl/english-words
-   https://github.com/dolph/dictionary
-   https://github.com/titoBouzout/Dictionaries

The idea is to create a `GitHubDictImportBase` class with common functionality (like fetching files from GitHub) and have child classes for each specific repository define the source-specific configuration.

For example, a child class would define:

1.  **Repository URL**: The URL of the GitHub repository.
2.  **File Paths**: The path(s) within the repository to the files that need to be processed.
3.  **Pre-processor Function**: An optional function to convert the file contents into a structured array of words and metadata. For a source like `titoBouzout/Dictionaries`, which contains classifications, this pre-processor would be responsible for extrapolating that data into the `part_of_speech`, `location`, etc., fields.

### Other Sources (Future)

This section is a placeholder for other potential import sources, such as:
-   Local `.csv` or `.txt` files.
-   Dictionary APIs.
