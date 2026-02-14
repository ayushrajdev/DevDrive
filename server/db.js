import { MongoClient } from "mongodb";

const url = "mongodb://localhost:27017/DevDrive";
const client = new MongoClient(url);

await client.connect();

const db = client.db();

export async function connectDb() {
  await client.connect();
  const db = client.db();
  return db;
}

export async function disConnectDb() {
  client.close();
}
