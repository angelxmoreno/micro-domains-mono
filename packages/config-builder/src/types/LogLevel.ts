import { NodeEnv } from './NodeEnv';

export enum LogLevel {
    silent = 'silent',
    debug = 'debug',
    info = 'info',
    warn = 'warn',
    error = 'error',
}

export const logLevels = Object.values(LogLevel) as [LogLevel, ...LogLevel[]];

export const inferLogLevel = (givenLevel: string | undefined, nodeEnv: NodeEnv): LogLevel => {
    if (givenLevel && logLevels.includes(givenLevel as LogLevel)) {
        return givenLevel as LogLevel;
    }

    if (nodeEnv === NodeEnv.development) {
        return LogLevel.debug;
    }

    if (nodeEnv === NodeEnv.test) {
        return LogLevel.silent;
    }

    return LogLevel.info;
};
