import type { TldType } from '../types/TldType';

export interface TldDtoInsert {
    tld: string;
    type?: TldType | null;
    whoisServer?: string | null;
    rdapServer?: string | null;
    isActive: boolean;
}
