import { connectDb, disConnectDb } from "./db.config.js";

try {
    const db = await connectDb();
    
    // add database level schema validation
    
    const command = "collMod"
    
    await db.command({
      [command]: "users",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["_id", "email", "name", "password", "rootDirId"],
          properties: {
            _id: {
              bsonType: "objectId",
            },
            email: {
              bsonType: "string",
            },
            name: {
              bsonType: "string",
            },
            password: {
              bsonType: "string",
            },
            rootDirId: {
              bsonType: "objectId",
            },
          },
        },
      },
      validationAction: "warn",
      validationLevel: "moderate",
    });
    await db.command({
      [command]: "files",
      validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          '_id',
          'extension',
          'name',
          'parentDirId',
          'userId'
        ],
        properties: {
          _id: {
            bsonType: 'objectId'
          },
          extension: {
            bsonType: 'string'
          },
          name: {
            bsonType: 'string'
          },
          parentDirId: {
            bsonType: 'objectId'
          },
          userId: {
            bsonType: 'objectId'
          }
        }
      }
    },
      validationAction: "warn",
      validationLevel: "moderate",
    });
    await db.command({
      [command]: "directories",
      validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          '_id',
          'name',
          'parentDirId',
          'userId'
        ],
        properties: {
          _id: {
            bsonType: 'objectId'
          },
          name: {
            bsonType: 'string'
          },
          parentDirId: {
            bsonType: [
              'objectId',
              'null'
            ]
          },
          userId: {
            bsonType: 'objectId'
          }
        }
      }
    },
      validationAction: "warn",
      validationLevel: "moderate",
    });
    
    await disConnectDb()
    
} catch (error) {
    console.log(error)
}