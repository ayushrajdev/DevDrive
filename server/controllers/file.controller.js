import { createWriteStream } from 'fs';
import path from 'path';
import { Collection, Db, ObjectId } from 'mongodb';
import { errorResponse } from '../Response.js';
import File from '../models/file.model.js';

async function getFile(req, res) {
  try {
    const { id } = req.params;
    const file = await File.findById(id);
    if (!file) return errorResponse(res);
    const filePath = `${process.cwd()}/storage/${id}${file.extension}`;
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
    const parentDirId = req.body.parentDirId || user.rootDirId;
    const { filename } = req.params || 'untitled';
    const extension = path.extname(filename);

    const savedFile = await File.create({
      name: filename,
      extension,
      parentDirId,
      userId: user._id,
    });
    const fullFilePath = `./storage/${savedFile._id.toString() + extension}`;

    const writeStream = createWriteStream(fullFilePath);

    req.pipe(writeStream);
    req.on('end', async () => {
      return res.json({ message: 'File Uploaded' });
    });

    req.on('error', async () => {
      return res.json({ message: 'failed' });
    });
  } catch (error) {
    console.log(error.message);
    res.json({ message: 'something went wrong' });
  }
}

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
