#!/usr/bin/env bun
import { CliApp, type CliAppParams } from '@repo/cli-helper';
import { DbImportCommand } from './commands/DbImportCommand';
import { DownloadCommand } from './commands/DownloadCommand';
import { ServeHttpCommand } from './commands/ServeHttpCommand';

const cliParams: CliAppParams = {
    name: 'repo-cli',
    description: 'A CLI application',
    version: '1.0.0',
    commands: [DownloadCommand, DbImportCommand, ServeHttpCommand],
};

const cliApp = new CliApp(cliParams);
cliApp.init().start().catch(console.error);
