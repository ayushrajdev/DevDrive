import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router";
import { ToastContainer, toast } from "react-toastify";

function DirectoryViewCopy() {
  const BASE_URL = "http://localhost:4000";
  const [directoryItems, setDirectoryItems] = useState([]);
  const [directoryName, setDirectoryName] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [renameModal, setRenameModal] = useState({ isOpen: false, oldName: "", newName: "" });
  const renameInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { "*": dirPath } = useParams();

  async function getDirectoryItems() {
    const response = await fetch(`${BASE_URL}/directory/${dirPath}`);
    const data = await response.json();
    setDirectoryItems(data);
  }

  useEffect(() => {
    getDirectoryItems();
  }, [dirPath]);

  useEffect(() => {
    if (renameModal.isOpen && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameModal.isOpen]);

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadFileName(file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/files/${dirPath}/${file.name}`, true);
    xhr.addEventListener("load", () => {
      setProgress(0);
      setUploadFileName("");
      toast.success("File uploaded successfully!");
      getDirectoryItems();
    });
    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;
      setProgress(totalProgress.toFixed(2));
    });
    xhr.send(file);
  }

  async function handleDelete(filename) {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        await fetch(`${BASE_URL}/files/${dirPath}/${filename}`, {
          method: "DELETE",
        });
        toast.success("File deleted successfully!");
        getDirectoryItems();
      } catch (error) {
        toast.error("Failed to delete file");
      }
    }
  }

  function openRenameModal(oldFilename) {
    const nameParts = oldFilename.split(".");
    const extension = nameParts.length > 1 ? "." + nameParts.pop() : "";
    const nameWithoutExt = nameParts.join(".");
    
    setRenameModal({
      isOpen: true,
      oldName: oldFilename,
      newName: nameWithoutExt,
      extension: extension
    });
  }

  function closeRenameModal() {
    setRenameModal({ isOpen: false, oldName: "", newName: "", extension: "" });
  }

  async function saveRename() {
    if (!renameModal.newName.trim()) {
      toast.error("Filename cannot be empty");
      return;
    }

    const newFullName = renameModal.newName + renameModal.extension;
    
    try {
      await fetch(
        `${BASE_URL}/files${dirPath ? `/${dirPath}` : ""}/${renameModal.oldName}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newFilename: `${dirPath}/${newFullName}` }),
        }
      );
      toast.success("File renamed successfully!");
      closeRenameModal();
      getDirectoryItems();
    } catch (error) {
      toast.error("Failed to rename file");
    }
  }

  async function createDirectory() {
    if (!directoryName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    try {
      await fetch(`${BASE_URL}/directory/${dirPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ directoryName: `/${dirPath}/${directoryName}` }),
      });
      toast.success("Folder created successfully!");
      setDirectoryName("");
      getDirectoryItems();
    } catch (error) {
      toast.error("Failed to create folder");
    }
  }

  const getFileIcon = (name, isDirectory) => {
    if (isDirectory) return "📁";
    const ext = name.split(".").pop().toLowerCase();
    const iconMap = {
      pdf: "📕", doc: "📄", docx: "📄", txt: "📝", xls: "📊", xlsx: "📊",
      jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", svg: "🎨",
      mp4: "🎬", avi: "🎬", mkv: "🎬", mov: "🎬", mp3: "🎵", wav: "🎵",
      zip: "📦", rar: "📦", z7: "📦", tar: "📦", gz: "📦",
      js: "⚙️", ts: "⚙️", jsx: "⚙️", tsx: "⚙️", py: "🐍", html: "🌐", css: "🎨", json: "📋"
    };
    return iconMap[ext] || "📄";
  };

  const filteredItems = directoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "type") {
      return a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">My Files</h1>
              <p className="text-sm text-slate-400">{dirPath || "Home"}</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>⬆️</span> Quick Upload
            </button>
          </div>
          
          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <span className="absolute right-4 top-3.5 text-slate-500">🔍</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="type">Sort by Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Create Folder */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl group-hover:bg-blue-500/30 transition-all">
                📁
              </div>
              <h3 className="text-lg font-semibold text-white">Create Folder</h3>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Enter folder name"
                value={directoryName}
                onChange={(e) => setDirectoryName(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                onClick={createDirectory}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                Create Folder
              </button>
            </form>
          </div>

          {/* Upload File */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl group-hover:bg-green-500/30 transition-all">
                ⬆️
              </div>
              <h3 className="text-lg font-semibold text-white">Upload File</h3>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={uploadFile}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-slate-300 hover:border-slate-500 transition-all cursor-pointer font-medium"
            >
              Click to browse or drag & drop
            </button>
            {uploadFileName && (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-2">{uploadFileName}</p>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-green-400 mt-1 font-semibold">{progress}%</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:bg-purple-500/30 transition-all">
                📊
              </div>
              <h3 className="text-lg font-semibold text-white">Statistics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Items</span>
                <span className="text-xl font-bold text-white">{filteredItems.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Folders</span>
                <span className="text-lg font-bold text-blue-400">{filteredItems.filter(i => i.isDirectory).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Files</span>
                <span className="text-lg font-bold text-green-400">{filteredItems.filter(i => !i.isDirectory).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            {searchTerm && `Search Results for "${searchTerm}"`}
            {!searchTerm && "Files & Folders"}
          </h2>

          {sortedItems.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700/50 p-16 text-center">
              <p className="text-slate-400 text-lg">
                {searchTerm ? "No files or folders match your search" : "No files or folders here"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedItems.map(({ name, isDirectory }) => (
                <div
                  key={name}
                  className="group bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-5 overflow-hidden"
                >
                  {/* Icon and Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-3xl flex-shrink-0">
                        {getFileIcon(name, isDirectory)}
                      </span>
                      <span className="font-semibold text-white text-sm break-all line-clamp-2 group-hover:text-blue-300 transition-colors">
                        {name}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {isDirectory && (
                      <Link
                        to={`./${name}`}
                        className="flex-1 px-3 py-2 text-xs font-medium text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-200 text-center hover:-translate-y-0.5"
                      >
                        Open
                      </Link>
                    )}
                    {!isDirectory && (
                      <>
                        <a
                          href={`${BASE_URL}/files/${dirPath}/${name}?action=open`}
                          className="flex-1 px-3 py-2 text-xs font-medium text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-200 text-center hover:-translate-y-0.5"
                        >
                          Open
                        </a>
                        <a
                          href={`${BASE_URL}/files/${dirPath}/${name}?action=download`}
                          className="flex-1 px-3 py-2 text-xs font-medium text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10 hover:border-green-500/50 transition-all duration-200 text-center hover:-translate-y-0.5"
                        >
                          Download
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => openRenameModal(name)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-200 text-center hover:-translate-y-0.5"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(name)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 text-center hover:-translate-y-0.5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Rename File</h2>
              <p className="text-sm text-slate-400 mt-1">Current: <span className="text-slate-300">{renameModal.oldName}</span></p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Name
                </label>
                <div className="flex gap-2">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameModal.newName}
                    onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename();
                      if (e.key === "Escape") closeRenameModal();
                    }}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter new name"
                  />
                  <div className="px-3 py-3 bg-slate-700/30 border border-slate-600 rounded-lg text-slate-400 font-medium text-sm flex items-center">
                    {renameModal.extension}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Preview: <span className="text-slate-300">{renameModal.newName}{renameModal.extension}</span></p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800/50 px-6 py-4 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={closeRenameModal}
                className="px-6 py-2.5 text-white font-semibold border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={saveRename}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default DirectoryViewCopy;