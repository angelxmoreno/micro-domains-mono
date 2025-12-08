const parseBoolean = (value: string | undefined): boolean => {
    if (value === undefined) return false;

    const normalized = value.trim().toLowerCase();

    const truthy = ['true', '1', 'yes', 'y', 'on'];
    const falsy = ['false', '0', 'no', 'n', 'off'];

    if (truthy.includes(normalized)) return true;
    if (falsy.includes(normalized)) return false;

    throw new Error(`Invalid boolean value: "${value}"`);
};

export const envParser = { parseBoolean };
