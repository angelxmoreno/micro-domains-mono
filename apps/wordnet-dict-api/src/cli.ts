#!/usr/bin/env bun
import { CliApp, type CliAppParams } from '@repo/cli-helper';
import { DownloadCommand } from './commands/DownloadCommand';

const cliParams: CliAppParams = {
    name: 'repo-cli',
    description: 'A CLI application',
    version: '1.0.0',
    commands: [DownloadCommand],
};

const cliApp = new CliApp(cliParams);
cliApp.init().start().catch(console.error);
