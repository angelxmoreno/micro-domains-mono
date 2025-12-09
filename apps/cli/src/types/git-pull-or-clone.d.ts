declare module 'git-pull-or-clone' {
    function pullOrClone(repo: string, dest: string, callback: (err?: Error | null) => void): void;

    export = pullOrClone;
}
