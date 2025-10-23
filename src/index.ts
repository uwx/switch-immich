import 'dotenv/config';
import type { ListMedia } from 'nxapi/coral';
import { $, os, path, usePowerShell } from 'zx';
import { upload } from './asset.js';
import { mkdir, readdir, readFile, utimes, writeFile } from 'node:fs/promises';
import mime from 'mime';
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { Readable } from 'node:stream';
import sanitize from 'sanitize-filename';
usePowerShell();

const version = await import('../package.json').then(m => m.version);
$.env.NXAPI_USER_AGENT = 'switch-immich/1.0.0 (+https://github.com/uwx/switch-immich)';

const user = await $`pnpm dlx nxapi@1.6.1-next.242 nso user`.text();

console.log(user);
const userId = user.match(/^ {2}id: '([a-f0-9]+)',$/m)?.[1];

if (!userId) {
    console.error(`No user ID found. Run 'pnpm dlx nxapi@1.6.1-next.242 nso auth --select'`);
    process.exit(1);
}

const proc = $`pnpm dlx nxapi@1.6.1-next.242 nso http-server --listen "127.0.0.1:63424" --no-require-token`.nothrow();

try {
    console.log('Started NXAPI HTTP server...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const media = await fetch(`http://localhost:63424/api/znc/media?user=${userId}`).then(e => e.json()) as ListMedia;

    for (const theMedia of media.media) {
        console.log(`Found media: ${theMedia.id} for app ${theMedia.appName}`);

        const sanitizedName = sanitize(theMedia.appName || 'Nintendo Switch');
        await mkdir(path.join('./media', sanitizedName), {recursive: true});

        await writeFile(path.join('./media', sanitizedName, 'metadata.json'), JSON.stringify({
            appName: theMedia.appName,
            appId: theMedia.applicationId,
        }, null, 2));

        await fetch(theMedia.contentUri).then(async res => {
            const ext = mime.getExtension(res.headers.get('content-type') || 'application/octet-stream');

            const filepath = path.join('./media', sanitizedName, `${theMedia.id}.${ext}`);
            const fileStream = createWriteStream(filepath, { flags: 'w+' });
            await finished(Readable.fromWeb(res.body!).pipe(fileStream));

            await utimes(filepath, new Date(theMedia.capturedAt*1000), new Date(theMedia.capturedAt*1000));
        });
    }
} finally {
    await proc.kill();
}

const defaultConfigDirectory = path.join(os.homedir(), '.config/immich/');

const folders = await readdir('./media', { withFileTypes: true });
for (const dirent of folders) {
    if (dirent.isDirectory()) {
        const fullPath = path.join(dirent.parentPath, dirent.name);
        const metadata = path.join(fullPath, 'metadata.json');
        const metadataContent = JSON.parse(await readFile(metadata, 'utf-8')) as { appName: string; appId: string; };
        
        await upload(
            [fullPath],
            {
                configDirectory: defaultConfigDirectory
            },
            {
                concurrency: 4,
                dryRun: false,
                jsonOutput: false,
                watch: false,
                album: false,
                albumName: `Nintendo Switch Screenshots: ${metadataContent.appName}`,
                recursive: false,
                skipHash: false,
                progress: true,
                delete: false,
                includeHidden: true,
            }
        );
    }
}
