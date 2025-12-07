# Gemini Integration

This document outlines the integration of Gemini models within the project, including configuration, usage, and benchmarking.

## Configuration

To use Gemini models, you need to configure the model provider. The project supports using Gemini through different endpoints, such_as OpenRouter.

### OpenRouter Configuration

To use Gemini via OpenRouter, you need to provide your OpenRouter API key. The configuration would look something like this:

```typescript
const geminiConfig = {
  model_name: 'google/gemini-2.0-flash-001',
  provider: 'openai_endpoint',
  openai_endpoint_url: 'https://openrouter.ai/api/v1',
  api_key: 'YOUR_OPENROUTER_API_KEY',
  temperature: 0,
};
```

## Usage

You can interact with the Gemini models through a dedicated `Gemini` class.

### Generating Content

To generate content, you can use the `generate_content_async` method. This method sends a request to the Gemini model and can handle streaming responses.

```typescript
import { Gemini } from './gemini'; // Assuming Gemini class is in './gemini'

const gemini = new Gemini({ model: 'gemini-1.5-flash' });

async function main() {
  const llmRequest = {
    // ... your request object
  };

  const responses = gemini.generate_content_async(llmRequest);

  for await (const response of responses) {
    console.log(response);
  }
}

main();
```

### Parallel Requests

The `GeminiModel` class also supports making parallel requests to the Gemini API using `call_parallel`. This can be useful for batch processing multiple prompts at once.

## Benchmarking

This project includes scripts for running benchmarks with Gemini models.

To run the benchmark with default settings:

```sh
python run_gemini_benchmark_fixed.py
```

To run with a custom number of examples:

```sh
python run_gemini_benchmark_fixed.py --examples 5
```

## Tooling and Schemas

The project includes utilities for working with Gemini, including a function to convert OpenAPI schemas to a format compatible with Gemini's function calling capabilities.

### OpenAPI Schema to Gemini Schema

The `_to_gemini_schema` function can be used to convert an OpenAPI schema dictionary into a Gemini `Schema` object.

```typescript
import { _to_gemini_schema } from './schema_converter'; // Assuming the function is in './schema_converter'

const openApiSchema = {
  // ... your OpenAPI schema
};

const geminiSchema = _to_gemini_schema(openApiSchema);
```
