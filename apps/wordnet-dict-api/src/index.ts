import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
    return c.text('Hello from WordNet Dictionary API!');
});

export default app;
