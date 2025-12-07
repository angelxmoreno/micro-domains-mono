type ArgParts = {
    name: string;
    description?: string;
    defaultValue?: unknown;
};

type OptionParts = {
    flags: string;
    description?: string;
    defaultValue?: string | boolean | string[];
};

type ActionFunction = (...args: unknown[]) => Promise<void>;

export type AppCommand = {
    command: string;
    description: string;
    action: ActionFunction;
    arguments?: ArgParts[];
    options?: OptionParts[];
};

// Helper type for creating type-safe action functions with explicit return type
export type TypedActionFunction<T extends unknown[], O = Record<string, unknown>> = (
    ...args: [...T, O]
) => Promise<void>;

// Helper function to create type-safe commands
export function createTypedCommand<T extends unknown[], O = Record<string, unknown>>(
    config: {
        command: string;
        description: string;
        arguments?: ArgParts[];
        options?: OptionParts[];
    },
    action: TypedActionFunction<T, O>
): AppCommand {
    return {
        ...config,
        action: action as ActionFunction,
    };
}
