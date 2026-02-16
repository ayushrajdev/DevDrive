import { MongoClient } from "mongodb";

const url = "mongodb://localhost:27017/DevDrive";
// const url = "mongodb://localhost:27017/";
const client = new MongoClient(url);

await client.connect();

const db = client.db();

// const res = await db.command({listCommands:1})
// const res = await db.command({listCollections:1})
// console.log(res)

// const users = db.collection("users")
// users.insertMany([
//   {age:23,name:"ayush"},
//   {age:21,name:"mohit"}
// ])

export async function connectDb() {
  await client.connect();
  const db = client.db();
  return db;
}

export async function disConnectDb() {
  client.close();
}
