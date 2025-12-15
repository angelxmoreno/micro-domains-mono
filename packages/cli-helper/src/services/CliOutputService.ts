export class CliOutputService {
    public log(message: string): void {
        console.log(message);
    }

    public error(message: string): void {
        console.error(message);
    }

    public logAndExit(message: string, code: number = 0): void {
        this.log(message);
        process.exit(code);
    }

    public errorAndExit(message: string, code: number = 1): void {
        this.error(message);
        process.exit(code);
    }
}
