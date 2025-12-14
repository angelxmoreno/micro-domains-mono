export interface ImporterInterface {
    name: string;
    run: () => Promise<void>;
}
