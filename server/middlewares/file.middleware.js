import Directory from '../models/directory.model';
import User from '../models/user.model';

export async function checkFileSize(size) {
    return async (req, res, next) => {
        let totalFileSize = 0;
        let aborted = false;

        req.on('data', (chunk) => {
            if (aborted) return;

            totalFileSize += chunk.length;

            // enforce YOUR limit, not client size
            if (totalFileSize > 50 * 1024 * 1024) {
                aborted = true;

                req.pause();
                writeStream.destroy();
                req.destroy();

                rm(fullFilePath).catch(() => {});
                savedFile.deleteOne().catch(() => {});

                return;
            }

            if (!writeStream.write(chunk)) {
                req.pause();
            }
        });

        writeStream.on('drain', () => {
            req.resume();
        });

        req.on('end', () => {
            if (!aborted) {
                writeStream.end();
                res.json({ message: 'File Uploaded' });
            }
        });

        req.on('error', () => {
            writeStream.destroy();
            res.status(500).json({ message: 'failed' });
        });
    };
}

export async function checkAvilableSpaceForFileUpload(req, res, next) {
    const user = req.user;
    const userRootDirectory = await Directory.findById(user.rootDirId);
    if (userRootDirectory.size > user.maxStorageInBytes) {
        return res.end();
    }
    const availableSpace = user.maxStorageInBytes - userRootDirectory.size;
    req.availableSpace = availableSpace;
    return next();
}
