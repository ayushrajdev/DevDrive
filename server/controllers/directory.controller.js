import { errorResponse, successResponse } from "../Response.js";
import { Db, ObjectId } from "mongodb";
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
  try {
    const db= req.db;
    const { id } = req.params;
    const filesCollection = db.collection("files")
    const directoriesCollection = db.collection("directories")

    const filesDeleted = await filesCollection.deleteMany({
      parentDirId: new ObjectId(id)
    })
    const directoriesDeleted = await directoriesCollection.deleteMany({
      _id:new ObjectId(id)
    })

    return successResponse(res)

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
