import { createWriteStream } from 'fs';
import path from 'path';
import { errorResponse } from '../Response.js';
import File from '../models/file.model.js';
import Directory from '../models/directory.model.js';

export async function updateDirectorySize(parentId, totalFileSize) {
    while (parentId) {
        parentDir = await Directory.findByIdAndUpdate(parentDirId, {
            $inc: {
                size: Number(totalFileSize),
            },
        });
        parentId = parentDir.parentDirId;
    }
}

async function getFile(req, res) {
    try {
        const { id } = req.params;
        const file = await File.findOne({
            _id: id,
            userId: req.user._id,
        });
        if (!file) return errorResponse(res);
        const filePath = `${import.meta.dirname}/../storage/${id}${file.extension}`;
        if (req.query.action === 'download') {
            // res.set("Content-Disposition", `attachment; filename=${fileInfo.name}`);
            return res.download(filePath, file.name);
        }
        return res.sendFile(filePath);
    } catch (error) {
        res.json({ message: 'file not found' });
    }
}

async function createFile(req, res) {
    try {
        const { user } = req;
    const availableSpace = req.availableSpace;
        let parentDirId = req.body.parentDirId || user.rootDirId;

        const { filename } = req.params || 'untitled';
        const extension = path.extname(filename);
        const size = req.body.size ?? 0;

        if (!size) {
            return res.end();
        }
        //limit 50mb file
        //check on the frontend for the size limit
        if ((size > 50 * 1024 * 1024) && (size > availableSpace)) {
            // // M1 - client will close the connection
            // res.set({
            //     Connection: 'close',
            // });
            // res.end()

            // M2 - server will close the connection
            // return req.socket.destroy();
            // return res.destroy();
            return res.socket.destroy();

            // return errorResponse(res, 'file limit exceeded', 413);
        }

        const savedFile = await File.create({
            name: filename,
            extension,
            parentDirId,
            userId: user._id,
            size: Number(size),
        });

        const fullFilePath = `${import.meta.dirname}/../storage/${savedFile._id.toString() + extension}`;

        const writeStream = createWriteStream(fullFilePath);
        // req.pipe(writeStream);

        let totalFileSize = 0;
        let aborted = false;

        req.on('data', async (chunk) => {
            if (aborted) return;
            totalFileSize += chunk.length;

            if (totalFileSize > size) {
                aborted = true;
                await rm(fullFilePath);
                writeStream.close();
                await savedFile.deleteOne();
                return req.destroy();
            }
            writeStream.write(chunk);
        });

        req.on('end', async () => {
            if (!aborted) {
                //parentdir of file
                // let parentDir = await Directory.findByIdAndUpdate(parentDirId, {
                //     $inc: {
                //         size: totalFileSize,
                //     },
                // }).lean();
                // while (parentDir.parentDirId) {
                //     parentDir = await Directory.findByIdAndUpdate(
                //         parentDir.parentDirId,
                //         {
                //             $inc: {
                //                 size: totalFileSize,
                //             },
                //         },
                //     );
                // }
                // let parentId = parentDirId;
                // while (parentId) {
                //     parentDir = await Directory.findByIdAndUpdate(parentDirId, {
                //         $inc: {
                //             size: totalFileSize,
                //         },
                //     });
                //     parentId = parentDir.parentDirId;
                // }
                await updateDirectorySize(parentDirId, totalFileSize);
                return res.json({ message: 'File Uploaded' });
            }
        });

        req.on('error', async () => {
            return res.json({ message: 'failed' });
        });
    } catch (error) {
        console.log(error.message);
        res.json({ message: 'something went wrong' });
    }
}

//! while deleting the file also decrease the size of the parent directory and its parent directory
async function deleteFile(req, res) {
    const { id } = req.params;
    try {
        await File.findByIdAndDelete(id);
        res.json({ message: 'File Deleted Successfully' });
    } catch (err) {
        res.status(404).json({ message: 'File Not Found!' });
    }
}

async function renameFile(req, res, next) {
    try {
        const { id } = req.params;
        const newFileName = req.body.newFileName;

        const result = await File.findByIdAndUpdate(id, {
            $set: {
                name: newFileName,
            },
        });

        res.json({ message: 'Renamed', result });
    } catch (error) {
        next(error);
    }
}

const fileController = {
    createFile,
    deleteFile,
    getFile,
    renameFile,
};
export default fileController;
