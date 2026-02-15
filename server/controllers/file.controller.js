import { createWriteStream, writeFileSync } from "fs";
import path from "path";
import { rm, writeFile } from "fs/promises";
import filesData from "../fileDB.json" with { type: "json" };
import directoriesData from "../directoriesDB.json" with { type: "json" };

async function getFile(req, res) {
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
}

async function createFile(req, res) {
  try {
    const { uid, user, DirectoryOfUser, parentDirId } = req;


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
}

async function deleteFile(req, res) {
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
}

async function renameFile(req, res, next) {
  try {
    const { id } = req.params;
    const fileInfo = filesData.find((file) => file.id == id);
    fileInfo.name = req.body.newFilename;
    await writeFile("./fileDB.json", JSON.stringify(filesData));
    res.json({ message: "Renamed" });
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
