# 🚀 DevDrive – Google Drive Inspired Storage Backend

> A scalable backend file storage system with Virtual File System (VFS), authentication, and optimized file handling built using Node.js, Express, and MongoDB.

---

## 📌 Overview

DevDrive is a backend system that replicates core functionality of Google Drive:

- User Authentication (JWT + Cookies)
- Nested Directory Structure
- Virtual File System (VFS)
- File CRUD Operations
- Secure Access Control
- Scalable Folder Architecture

The system avoids deeply nested routes by implementing a **Virtual File System (VFS)** pattern for better scalability and maintainability.

---

## 🧠 Problem Statement

Traditional file storage systems using deeply nested routes become hard to manage and scale. This project implements a **Virtual File System (VFS)** approach where folder hierarchy is managed at the database level instead of route nesting.

**This improves:**
- Maintainability
- Scalability
- Query efficiency
- Code clarity

---

## 🏗 Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime Environment |
| **Express.js** | Backend Framework |
| **MongoDB** | Database |
| **JWT** | Authentication |
| **Cookie Parser** | Session Handling |
| **CORS** | Cross-Origin Security |
| **bcrypt** | Password Hashing |

---

## 📂 Project Structure

```
src/
├── controllers/
│   ├── user.controller.js
│   ├── file.controller.js
│   └── directory.controller.js
├── routes/
│   ├── user.route.js
│   ├── file.route.js
│   └── directory.route.js
├── middleware/
│   └── checkUser.js
├── config/
│   └── database.config.js
├── utils/
│   └── helpers.js
└── server.js
```

### Folder Responsibilities

- **controllers/** → Business logic for handling requests
- **routes/** → API endpoint definitions
- **middleware/** → Authentication & security layer
- **config/** → Database & environment configuration
- **utils/** → Reusable utility functions
- **server.js** → Application entry point

---

## 🔐 Authentication APIs

### 📝 Register User

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

---

### 🔑 Login

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful"
}
```

**Note:** JWT is stored in an HTTP-only cookie for security.

---

### 🚪 Logout

**Endpoint:** `POST /logout`

**Description:** Clears the authentication cookie and logs out the user.

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

### 👤 Get User Profile

**Endpoint:** `GET /profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
or
Cookie: token=<jwt_token>
```

**Protected Route:** Requires `checkUser` middleware

**Response:**
```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "rootDirId": "root_directory_id",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 📁 Directory APIs (VFS Based)

### Get Directory Details

**Endpoint:** `GET /directory/:id?`

- If no `id` → returns root directory
- If `id` provided → returns sub-directory details

**Response:**
```json
{
  "_id": "directory_id",
  "name": "My Folder",
  "parentId": "parent_directory_id",
  "ownerId": "user_id",
  "createdAt": "2024-01-15T10:30:00Z",
  "subdirectories": [],
  "files": []
}
```

---

### Create Directory

**Endpoint:** `POST /directory/:dirname`

**Request Body:**
```json
{
  "parentId": "parent_directory_id"
}
```

**Description:** Creates a new directory inside the specified parent directory.

**Response:**
```json
{
  "_id": "new_directory_id",
  "name": "New Folder",
  "parentId": "parent_directory_id",
  "ownerId": "user_id",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Rename Directory

**Endpoint:** `PUT /directory/:id`

**Request Body:**
```json
{
  "name": "Updated Folder Name"
}
```

**Response:**
```json
{
  "_id": "directory_id",
  "name": "Updated Folder Name",
  "parentId": "parent_directory_id",
  "ownerId": "user_id"
}
```

---

### Delete Directory

**Endpoint:** `DELETE /directory/:id`

**Response:**
```json
{
  "message": "Directory deleted successfully"
}
```

**Note:** Deleting a directory may also delete its contents based on your implementation.

---

## 📄 File APIs

### Create File

**Endpoint:** `POST /file/:filename`

**Request Body:**
```json
{
  "parentId": "parent_directory_id",
  "size": 1024
}
```

**Response:**
```json
{
  "_id": "file_id",
  "name": "document.pdf",
  "parentId": "parent_directory_id",
  "ownerId": "user_id",
  "size": 1024,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Get File

**Endpoint:** `GET /file/:id`

**Response:**
```json
{
  "_id": "file_id",
  "name": "document.pdf",
  "parentId": "parent_directory_id",
  "ownerId": "user_id",
  "size": 1024,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Rename File

**Endpoint:** `PUT /file/:id`

**Request Body:**
```json
{
  "name": "renamed_document.pdf"
}
```

**Response:**
```json
{
  "_id": "file_id",
  "name": "renamed_document.pdf",
  "parentId": "parent_directory_id",
  "ownerId": "user_id"
}
```

---

### Delete File

**Endpoint:** `DELETE /file/:id`

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

---

## 🗃 Database Schema

### Users Collection

```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "password": "hashed_password",
  "rootDirId": "ObjectId",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Directories Collection

```json
{
  "_id": "ObjectId",
  "name": "Folder Name",
  "parentId": "ObjectId | null",
  "ownerId": "ObjectId",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Files Collection

```json
{
  "_id": "ObjectId",
  "name": "file.pdf",
  "parentId": "ObjectId",
  "ownerId": "ObjectId",
  "size": 1024,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 🧱 Virtual File System (VFS) Architecture

### Traditional Approach (❌ Not Scalable)
```
/api/dir1/dir2/dir3/file.txt
```

### VFS Approach (✅ Scalable)
We store hierarchy in the database using:
- `parentId` → Links each item to its parent
- `ownerId` → Tracks data ownership
- `name` → Item identifier within its parent

**Advantages:**
- Flat routing structure
- Scalable querying
- Efficient directory traversal
- Cleaner, maintainable codebase
- Easy pagination and filtering

---

## 🔐 Security Measures

- **JWT Authentication** – Stateless authentication with tokens
- **HTTP-only Cookies** – Prevents XSS attacks
- **Password Hashing** – bcrypt for secure password storage
- **CORS Configuration** – Prevents cross-origin attacks
- **Input Validation** – Sanitizes user input
- **Authorization Checks** – Verifies ownerId for all operations
- **Protected Routes** – Middleware guards sensitive endpoints

---

## ⚡ Performance Optimizations

- **Indexed Database Fields** – Optimized frequently queried fields (userId, parentId)
- **Flat Routing** – Avoided recursive nested routing
- **VFS Pattern** – Efficient data structure
- **Optimized Queries** – Minimal data fetching
- **Connection Pooling** – Reuses database connections

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd devdrive
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create Environment File

Create a `.env` file in the root directory:

```env
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/devdrive
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

### 4️⃣ Run the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:4000`

---

## 📊 Architecture Flow

```
Client Request
    ↓
Express Router
    ↓
Middleware (Authentication, Validation)
    ↓
Controller (Business Logic)
    ↓
MongoDB Database
    ↓
Response to Client
```

---

## 🛠 Future Enhancements

- **File Streaming** → Support for large file uploads/downloads with Range headers
- **File Sharing** → Share files and folders with other users
- **Cloud Storage** → Integration with AWS S3 or Google Cloud Storage
- **Role-Based Access** → Admin, Editor, Viewer roles
- **File Versioning** → Track and restore previous file versions
- **Redis Caching** → Improve query performance with caching
- **Activity Logs** → Track user actions and file modifications
- **Real-time Sync** → WebSocket support for live updates

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

**Ayush Raj**  
B.Tech CSE (AI & ML)  
Backend Developer | MERN Stack

---

## ⭐ Key Takeaways

This project demonstrates:

- Backend architecture design and best practices
- Secure authentication flows (JWT + Cookies)
- MongoDB schema design and optimization
- Virtual File System implementation
- RESTful API design principles
- Secure session handling
- Error handling and validation
- Database indexing and query optimization

---

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Happy Coding! 🎉**

![alt text](/server/assests/images/image.png)