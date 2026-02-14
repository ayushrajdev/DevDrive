import express from "express";
import { createWriteStream, writeFileSync } from "fs";
import path from "path";
import { rm, writeFile } from "fs/promises";
import filesData from "../fileDB.json" with { type: "json" };
import directoriesData from "../directoriesDB.json" with { type: "json" };
import { dirIdOfCurrentUser } from "../middlewares/auth.middleware.js";
import { errorResponse } from "../Response.js";

const router = express.Router();

router.param("id", (req, res, next, id) => {
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(id)) {
    return errorResponse(res, "invalid id");
  }
  next()
});

//vfs done ✅
router.post("/:filename", dirIdOfCurrentUser, (req, res) => {
  try {
    const { uid, user, DirectoryOfUser, parentDirId } = req;
    console.log("dfnjbwdhvfbbbbbbbbbbbbbbbbbbbbbbbb");
    // const parentDirId =
    //   !req.headers.parentdirid == "null"
    //     ? req.headers.parentdirid
    //     : directoriesData[0].id;

    const { filename } = req.params || "untitled";
    const extensionName = path.extname(filename);
    const randomId = crypto.randomUUID();
    const fullFileName = randomId + extensionName;
    const writeStream = createWriteStream(`./storage/${fullFileName}`);

    req.pipe(writeStream);
    req.on("end", async () => {
      filesData.push({
        name: filename,
        id: randomId,
        extension: extensionName,
        parentDirId,
        userId: user.id,
      });

      DirectoryOfUser.files.push(randomId);

      await writeFile("./fileDB.json", JSON.stringify(filesData));
      writeFileSync("./directoriesDB.json", JSON.stringify(directoriesData));
      return res.json({ message: "File Uploaded" });
    });
  } catch (error) {
    console.log(error.message);
    res.json({ message: "something went wrong" });
  }
});

// vfs done ✅
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const fileIndex = filesData.findIndex((file) => file.id == id);
  const fileInfo = filesData[fileIndex];
  const filePath = `./storage/${id}${fileInfo.extension}`;

  try {
    await rm(filePath, { recursive: true });
    filesData.splice(fileIndex, 1);
    const directoryInfo = directoriesData.find(
      (directory) => directory.id === fileInfo.parentDirId,
    );
    directoryInfo.files = directoryInfo.files.filter((fileId) => fileId !== id);
    await writeFile("./fileDB.json", JSON.stringify(filesData));
    await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));
    res.json({ message: "File Deleted Successfully" });
  } catch (err) {
    res.status(404).json({ message: "File Not Found!" });
  }
});

//vfs done✅
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const fileInfo = filesData.find((file) => file.id == id);
    if (!fileInfo) {
      return res.status(404).json({ message: "file not found" });
    }
    const filePath = `${process.cwd()}/storage/${id}${fileInfo.extension}`;
    if (req.query.action === "download") {
      // res.set("Content-Disposition", `attachment; filename=${fileInfo.name}`);
      return res.download(filePath, fileInfo.name);
    }
    return res.sendFile(filePath);
  } catch (error) {
    res.json({ message: "file not found" });
  }
});

// vfs done ✅
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const fileInfo = filesData.find((file) => file.id == id);
    fileInfo.name = req.body.newFilename;
    await writeFile("./fileDB.json", JSON.stringify(filesData));
    res.json({ message: "Renamed" });
  } catch (error) {
    next(error);
  }
});

export default router;
