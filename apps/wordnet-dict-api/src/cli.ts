#!/usr/bin/env bun
import { CliApp, type CliAppParams } from '@repo/cli-helper';
import { DbImportCommand } from './commands/DbImportCommand';
import { DownloadCommand } from './commands/DownloadCommand';

const cliParams: CliAppParams = {
    name: 'repo-cli',
    description: 'A CLI application',
    version: '1.0.0',
    commands: [DownloadCommand, DbImportCommand],
};

const cliApp = new CliApp(cliParams);
cliApp.init().start().catch(console.error);
