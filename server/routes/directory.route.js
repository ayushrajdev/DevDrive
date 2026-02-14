import express from "express";
import { writeFile } from "fs/promises";
import directoriesData from "../directoriesDB.json" with { type: "json" };
import filesData from "../fileDB.json" with { type: "json" };
import usersData from "../fileDB.json" with { type: "json" };
import { errorResponse, successResponse } from "../Response.js";

const router = express.Router();

// ✅
router.get("/:id?", async (req, res) => {
  try {
    const { user, uid } = req;
    const { id } = req.params;
    let directoryInfo;

    if (id) {
      directoryInfo = directoriesData.find(
        (dir) => dir.id == id && dir.userId == uid,
      );
    } else {
      directoryInfo = directoriesData.find(
        (dir) => !dir.parentDirId && dir.userId == uid,
      );
    }

    let files = directoryInfo?.files?.map((fileId) =>
      filesData.find((file) => fileId == file.id),
    );
    let directories = directoryInfo?.directories?.map((dirId) => {
      return directoriesData.find((dir) => dir.id == dirId);
    });
    return res.json({ ...directoryInfo, files, directories });
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/:dirname?", async (req, res) => {
  try {
    const { uid, user } = req;
    // id of in which the user is creating new directory
    const parentDirId = req.headers.parentdirid || user.rootDirID;
    const { dirname } = req.params;
    const randomDirId = crypto.randomUUID();

    // dir in which the user is creating directory
    let userParentDirInfo = directoriesData.find(
      (dir) => dir.id == parentDirId && dir.userId == uid,
    );

    if (!userParentDirInfo) {
      return errorResponse(res);
    }

    directoriesData.push({
      name: dirname,
      id: randomDirId,
      parentDirId,
      files: [],
      directories: [],
      userId: uid,
    });

    userParentDirInfo.directories.push(randomDirId);

    await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));
    res.json({ m: "folder created" });
  } catch (error) {
    res.json({ m: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const newDirName = req.headers.newdirname;

  try {
    const directoryInfo = directoriesData.find((dir) => dir.id == id);
    directoryInfo.name = newDirName;
    await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));
    res.json({ m: "folder renamed" });
  } catch (error) {
    console.log(error.message);
    res.json({ m: error.message });
  }
});

// router.delete("/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const directoryIndex = directoriesData.findIndex((dir) => dir.id == id);
//     const directoryInfo = directoriesData[directoryIndex];
//     // directoriesData.splice(directoryIndex,1)
//     // await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));

//     async function deleteFilesAndFolder(directory) {
//       for await (const fileId of directoryInfo.files) {
//         const fileIndex = filesData.findIndex((file) => fileId == file.id);
//         const fileInfo = filesData[fileIndex];
//         filesData.splice(fileIndex, 1);
//         await writeFile("./fileDB.json", JSON.stringify(filesData));
//       }
//       if (!directory?.directories?.length) {
//         return;
//       }
//       for await (const directoryId of directoryInfo.directories) {
//         const directoryIndex = directoriesData.findIndex(
//           (directory) => directoryId == directory.id,
//         );
//         const directoryInfo = directoriesData[directoryIndex];
//         await  deleteFilesAndFolder(directoryInfo)
//         directoriesData.splice(directoryIndex, 1);
//         await writeFile(
//           "./directoriesDB.json",
//           JSON.stringify(directoriesData),
//         );
//         // deleteFilesAndFolder(directoryInfo);
//       }
//     }
//     await deleteFilesAndFolder(directoryInfo);
//     res.json({ m: "folder deleted successfully" });
//   } catch (error) {
//     console.log(error.message);
//   }
// });

router.delete("/:id", async (req, res) => {
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
});

export default router;
