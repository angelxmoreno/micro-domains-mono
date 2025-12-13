#!/usr/bin/env bun
import { CliApp, type CliAppParams } from '@repo/cli-helper';
import { DbImportCommand } from './commands/DbImportCommand';
import { ServeHttpCommand } from './commands/ServeHttpCommand';

const cliParams: CliAppParams = {
    name: 'wordnet-dict-api',
    description: 'CLI for WordNet dictionary API - manage database, download data, and serve HTTP API',
    version: '1.0.0',
    commands: [DbImportCommand, ServeHttpCommand],
};

const cliApp = new CliApp(cliParams);
cliApp.init().start().catch(console.error);
