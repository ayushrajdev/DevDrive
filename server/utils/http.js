import { createWriteStream } from "fs";
import { open, readdir, readFile, rename, rm } from "fs/promises";
import http from "http";
import mime from "mime-types";

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  console.log(req.method);
  if (req.method === "GET") {
    if (req.url === "/favicon.ico") return res.end("No favicon.");
    if (req.url === "/") {
      serveDirectory(req, res);
    } else {
      try {
        const [url, queryString] = req.url.split("?");
        const queryParam = {};
        queryString?.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");
          queryParam[key] = value;
        });
        console.log(queryParam);

        const fileHandle = await open(`./storage${decodeURIComponent(url)}`);
        const stats = await fileHandle.stat();
        if (stats.isDirectory()) {
          serveDirectory(req, res);
        } else {
          const readStream = fileHandle.createReadStream();
          res.setHeader("Content-Type", mime.contentType(url.slice(1)));
          res.setHeader("Content-Length", stats.size);
          if (queryParam.action === "download") {
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${url.slice(1)}"`
            );
          }
          readStream.pipe(res);
        }
      } catch (err) {
        console.log(err.message);
        res.end("Not Found!");
      }
    }
  } else if (req.method === "OPTIONS") {
    res.end("OK");
  } else if (req.method === "POST") {
    const writeStream = createWriteStream(`./storage/${req.headers.filename}`);
    let count = 0;
    req.on("data", (chunk) => {
      count++;
      writeStream.write(chunk);
    });
    req.on("end", () => {
      console.log(count);
      writeStream.end();
      res.end("File uploaded on the server");
    });
  } else if (req.method === "DELETE") {
    req.on("data", async (chunk) => {
      try {
        const filename = chunk.toString();
        await rm(`./storage/${filename}`);
        res.end("File deleted successfully");
      } catch (err) {
        res.end(err.message);
      }
    });
  } else if (req.method === "PATCH") {
    req.on("data", async (chunk) => {
      const data = JSON.parse(chunk.toString());
      await rename(
        `./storage/${data.oldFilename}`,
        `./storage/${data.newFilename}`
      );
      res.end("File renamed");
    });
  }
});

async function serveDirectory(req, res) {
  const [url] = req.url.split("?");
  const itemsList = await readdir(`./storage${url}`);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(itemsList));
}

server.listen(80, () => {
  console.log("Server started");
});




  // {
  //   "id": "6426a9bf-8ad3-49f3-9c04-6e49812776bf",
  //   "name": "root",
  //   "parentDir": null,
  //   "files": [
  //     "78362f36-7795-48f2-a6e7-028fd42d4ce7",
  //     "14058314-0cc6-4564-8f61-95c031e1f87c",
  //     "b40309e1-9f78-47f5-956d-ceb4bbe1eeba",
  //     "c1e9e9d9-d13d-4ad5-851d-f9f612043022"
  //   ],
  //   "directories": [
  //     "361c677d-d5f3-45ba-8ea9-6e27e1677ea5",
  //     "0d99f44e-dd72-4365-bd3f-7f54516bb160",
  //     "3e85450a-77bd-40cd-8748-ab33f7b7e067"
  //   ]
  // },