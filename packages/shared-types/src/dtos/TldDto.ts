import type { TldType } from '../types/TldType';

export interface TldDtoInsert {
    tld: string;
    type?: TldType | null;
    whoisServer?: string | null;
    rdapServers?: string[] | null;
    isActive?: boolean;
}
