import Directory from '../models/directory.model.js';
import File from '../models/file.model.js';
import { errorResponse, successResponse } from '../Response.js';
import {  ObjectId } from 'mongodb';

async function getDirDetails(req, res) {
  try {
    const id = req.params.id || user.rootDirId;
    const directoryDetails = await Directory.findById(id).lean();
    const directories = await Directory.find({
      parentDirId: id,
    }).lean();
    const files = await File.find({
      parentDirId: id,
    })
      .lean()
      .populate('parentDirId', 'name -_id')
      .populate('userId', 'email -_id')
      .select('name userId -_id');

    console.log(directoryDetails);

    return res.json({ files, directories, directoryDetails });
  } catch (error) {
    res.json({ error: error.message });
    console.log(error.message);
  }
}

async function createNewDir(req, res) {
  try {
    const { uid, user } = req;
    const { dirname } = req.params;
    // id of in which the user is creating new directory
    const parentDirId = req.body.parentDirId || user.rootDirId;

    const parentDir = await Directory.findById(parentDirId).lean();

    if (!parentDir) {
      return errorResponse(res);
    }

    const savedDir = await Directory.create({
      name: dirname,
      parentDirId,
      userId: user._id,
    });

    res.json({ savedDir });
  } catch (error) {
    res.json({ m: error.message });
  }
}

async function renameDir(req, res) {
  const { id } = req.params;
  const newDirName = req.body.newDirName;

  try {
    const result = await Directory.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: newDirName,
        },
      },
    );

    console.log(result);

    res.json({ m: 'folder renamed' });
  } catch (error) {
    console.log(error.message);
    res.json({ m: error.message });
  }
}

// under maintainance
async function deleteDir(req, res) {
  try {
    const db = req.db;
    const { id } = req.params;
    const filesCollection = db.collection('files');
    const directoriesCollection = db.collection('directories');

    async function findRecurrssiveFileAndDir(id) {
      let files = await filesCollection
        .find({
          parentDirId: new ObjectId(id),
        })
        .toArray();
      let directories = await directoriesCollection
        .find({
          parentDirId: new ObjectId(id),
        })
        .toArray();

      for await (const { _id, name } of directories) {
        const { files: childFiles, directories: childDirectories } =
          await findRecurrssiveFileAndDir(_id);

        files = [...files, childFiles];
        directories = [...directories, childDirectories];
      }

      return { files, directories };
    }
    const { files, directories } = await findRecurrssiveFileAndDir();

    for await (const { _id, extension } of files) {
      await rm(`./storage/${_id.toString()}${extension}`);
    }

    filesCollection.deleteMany({
      _id: {
        $in: files.map(({ _id }) => _id),
      },
    });

    directoriesCollection.deleteMany({
      _id: {
        $in: directories.map(({ _id }) => _id),
      },
    });

    return successResponse(res);
  } catch (error) {
    console.log(error);
    return errorResponse(res);
  }
}

const directoryController = {
  createNewDir,
  getDirDetails,
  renameDir,
  deleteDir,
};

export default directoryController;
