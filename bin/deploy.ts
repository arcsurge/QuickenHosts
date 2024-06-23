import { cmd } from "@/utils/ShellScript";
import { copy, remove, rename } from "@/utils/fileUtil";
import path from "node:path";

(async () => {
    const cleanupDirs = ['./target/', './dist/'];
    const buildCommands = [
        { command: 'npm run build', displayName: 'build' },
        { command: 'npm run ts:compile', displayName: 'compile' }
    ];
    const specialAsset = {
        logoSource: './src/assets/images/logo.png',
        logoTarget: './dist/assets/logo.png'
    };
    const assetOperations = [
        './dist/assets/',
        './dist/index.html',
        './dist/plugin.json',
        './dist/preload.js',
        './dist/public/'
    ];
    try {
        console.log("Starting deployment...");

        // Clean up
        console.log("Clean up...");
        await Promise.all(cleanupDirs.map(dir => remove(path.resolve(dir))));

        // Build and Compile
        for (const { command, displayName } of buildCommands) {
            console.log(`Running ${command}...`);
            await cmd(command, { name: displayName });
        }

        // Special case: Copy logo image
        console.log("Copying logo image...");
        await copy(path.resolve(specialAsset.logoSource), path.resolve(specialAsset.logoTarget), { cover: true });

        // Prepare Assets
        console.log("Preparing assets...");
        await Promise.all(assetOperations.map(srcPath => {
            const destPath = srcPath.replace('/dist/', '/target/');
            return copy(path.resolve(srcPath), path.resolve(destPath), { cover: true });
        }));

        // Clean up and finalize
        console.log("Cleaning up and finalizing...");
        await remove(path.resolve('./dist/'));
        await rename(path.resolve('./target/'), path.resolve('./dist/'));

        console.log("Deployment successful!");
    } catch (error) {
        console.error("An error occurred during deployment:", error);
    }
})();
