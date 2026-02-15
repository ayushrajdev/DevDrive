import { writeFile } from "fs/promises";
import directoriesData from "../directoriesDB.json" with { type: "json" };
import filesData from "../fileDB.json" with { type: "json" };
import { errorResponse } from "../Response.js";
import { ObjectId } from "mongodb";
async function getDirDetails(req, res) {
  try {
    const { user, db } = req;
    const id = req.params.id || user.rootDirId;
    const filesCollection = db.collection("files");
    const directoriesCollection = db.collection("directories");

    const directoryDetails = await directoriesCollection.findOne({
      _id: new ObjectId(id),
    });

    const directories = await directoriesCollection
      .find({
        parentDirId: new ObjectId(directoryDetails._id),
      })
      .toArray();
    const files = await filesCollection
      .find({
        parentDirId: new ObjectId(directoryDetails._id),
      })
      .toArray();

    return res.json({ ...directoryDetails, files, directories });
  } catch (error) {
    console.log(error.message);
  }
}

async function createNewDir(req, res) {
  try {
    const { uid, user, db } = req;
    const { dirname } = req.params;
    // id of in which the user is creating new directory
    // ➕
    const parentDirId = req.body.parentDirId || user.rootDirId;
    const directoriesCollection = db.collection("directories");

    const parentDir = directoriesCollection.findOne({
      _id: new ObjectId(parentDirId),
    });

    if (!parentDir) {
      return errorResponse(res);
    }

    const insertedDir = await directoriesCollection.insertOne({
      name: dirname,
      parentDirId: parentDirId,
      userId: user._id,
    });

    res.json({ insertedDir });
  } catch (error) {
    res.json({ m: error.message });
  }
}

async function renameDir(req, res) {
  const { db } = req;
  const { id } = req.params;
  const newDirName = req.body.newDirName;
  const directoriesCollection = db.collection("directories");

  try {
    const result = await directoriesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: newDirName,
        },
      },
    );

    console.log(result);

    res.json({ m: "folder renamed" });
  } catch (error) {
    console.log(error.message);
    res.json({ m: error.message });
  }
}

async function deleteDir(req, res) {
  const { id } = req.params;

  try {
    const directoryIndex = directoriesData.findIndex((dir) => dir.id == id);

    if (directoryIndex === -1) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const directoryInfo = directoriesData[directoryIndex];

    async function deleteFilesAndFolder(directory) {
      // 1️⃣ Delete all files in this directory
      for (const fileId of directory.files) {
        const fileIndex = filesData.findIndex((file) => file.id == fileId);

        if (fileIndex !== -1) {
          filesData.splice(fileIndex, 1);
        }
      }

      await writeFile("./fileDB.json", JSON.stringify(filesData));

      // 2️⃣ Recursively delete subdirectories
      for (const subDirId of directory.directories) {
        const subDirIndex = directoriesData.findIndex(
          (dir) => dir.id == subDirId,
        );

        if (subDirIndex !== -1) {
          const subDirInfo = directoriesData[subDirIndex];

          await deleteFilesAndFolder(subDirInfo);

          directoriesData.splice(subDirIndex, 1);
        }
      }

      await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));
    }

    // delete inner content
    await deleteFilesAndFolder(directoryInfo);

    // delete root directory itself
    directoriesData.splice(directoryIndex, 1);

    await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
}

const directoryController = {
  createNewDir,
  getDirDetails,
  renameDir,
  deleteDir,
};

export default directoryController;
