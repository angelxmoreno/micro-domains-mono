export class CliOutputService {
    public log(message: string): void {
        console.log(message);
    }

    public error(message: string): void {
        console.error(message);
    }
}
