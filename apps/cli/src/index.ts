#!/usr/bin/env bun
import { CliApp, type CliAppParams } from '@repo/cli-helper';
import { dictImportProgram } from './commands/DictImportCommand';
import { helloProgram } from './commands/HelloCommand';
import { appContainer } from './config';

const cliParams: CliAppParams = {
    name: 'repo-cli',
    description: 'A CLI application',
    version: '1.0.0',
    container: appContainer,
    commands: [helloProgram, dictImportProgram],
};

const cliApp = new CliApp(cliParams);
cliApp.init().start();
