import pullOrClone from 'git-pull-or-clone';

/**
 * Clone a git repo if missing, or pull if it already exists.
 * Promisified wrapper around git-pull-or-clone.
 */
export function cloneOrPull(repo: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pullOrClone(repo, dest, (err?: Error | null) => {
            if (err) return reject(err);
            resolve();
        });
    });
}
