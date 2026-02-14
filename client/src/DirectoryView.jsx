import { useEffect, useState } from "react";
import { Link, replace, useNavigate, useParams } from "react-router";
import { ToastContainer, toast } from "react-toastify";

function DirectoryView() {
  const BASE_URL = "http://localhost:4000";
  const [directoryName, setDirectoryName] = useState();
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [directoryViewOnPage, setDirectoryViewOnPage] = useState([]);
  const [filesViewOnPage, setFilesViewOnPage] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newFilename, setNewFilename] = useState("");
  const { directoryIdFromUrl } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    getDirectoryItems();
  }, [directoryIdFromUrl]);

  async function getDirectoryItems() {
    const response = await fetch(
      `${BASE_URL}/directory/${directoryIdFromUrl ?? ""}`,
      {
        credentials:"include"
      }
    );
    const data = await response.json();
    console.log(data);
    setDirectoryViewOnPage(data.directories);
    setFilesViewOnPage(data.files);
  }

  async function handleUploadFile(e) {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true
    xhr.open("POST", `${BASE_URL}/file/${file.name}`, true);
    xhr.setRequestHeader("parentdirid", directoryIdFromUrl ?? "");
    xhr.addEventListener("load", () => {
      getDirectoryItems();
    });
    xhr.upload.addEventListener("progress", (e) => {
      console.log(e)
      const totalProgress = (e.loaded / e.total) * 100;
      setProgress(totalProgress.toFixed(2));
    });
    xhr.send(file);
  }

  async function handleDeleteFile(id) {
    const response = await fetch(`${BASE_URL}/file/${id}`, {
      method: "DELETE",
      credentials:"include"
    });
    const data = await response.text();
    getDirectoryItems();
  }

  async function handleRenameFile(id) {
    try {
      const response = await fetch(`${BASE_URL}/file/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newFilename }),
        credentials:"include"
      });
      const data = await response.text();
      console.log(data);
      setNewFilename("");
      getDirectoryItems();
    } catch (error) {
      console.log(error);
    }
  }

  async function handleCreateDirectory() {
    try {
      if (!directoryName.trim()) return;
      const response = await fetch(`${BASE_URL}/directory/${directoryName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          parentdirid: `${directoryIdFromUrl ?? ""}`,
        },
        credentials:"include"
      });
      const data = await response.json();
      toast("folder created successfully");
      getDirectoryItems();
    } catch (error) {
      console.log(error.message);
    }
  }

  async function handleRenameDirectory(dirId) {
    try {
      const response = await fetch(`${BASE_URL}/directory/${dirId}`, {
        headers: {
          newdirname: `${newDirectoryName}`,
        },
        method: "PUT",
      });
      if (!response.ok) {
        return toast("something went wrong");
      }
      toast("Directory renamed");
      setDirectoryName("");
      getDirectoryItems();
    } catch (error) {
      console.log(error);
    }
  }

  async function handleDeleteDirectory(id) {
    try {
      console.log(id);

      const response = await fetch(`${BASE_URL}/directory/${id}`, {
        method: "DELETE",
      });
      console.log(response);
      const data = await response.json();
      console.log(data);
      getDirectoryItems();
    } catch (error) {
      console.log(error.message);
    }
  }
  return (
    <div className="bg-gray-800">
      <button
        className="btn"
        onClick={() => document.getElementById("my_modal_2").showModal()}
      >
        create directory
      </button>
      <dialog id="my_modal_2" className="modal">
        <div className="modal-box">
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              className="input"
              placeholder="enter the name of directory"
              type="text"
              onChange={(e) => setDirectoryName(e.target.value)}
              value={directoryName}
            />
            <button onClick={handleCreateDirectory}>create directory</button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <div>
        <input type="file" className="file-input" onChange={handleUploadFile} />

        <p>Progress: {progress}%</p>
      </div>
      <br />
      <br />
      <br />

      <h1>My Files</h1>
      {filesViewOnPage?.map(({ name, id }) => (
        <div key={id}>
          {name}
          <br />
          <a href={`${BASE_URL}/file/${id}?action=open`}>Open</a>

          <a href={`${BASE_URL}/file/${id}?action=download`}>Download</a>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setNewFilename(name);
            }}
          >
            Rename
          </button>

          <button
            className="btn"
            onClick={() => document.getElementById("my_modal_1").showModal()}
          >
            delete
          </button>

          <div>
            <dialog id="my_modal_1" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg text-red-600">Warning!!!</h3>
                <p className="py-4">do you want to delete this file</p>
                <div className="modal-action">
                  <button className="btn" onClick={() => handleDeleteFile(id)}>
                    okay
                  </button>
                  <form method="dialog">
                    <button className="btn">Close</button>
                  </form>
                </div>
              </div>
            </dialog>
          </div>

          {isModalOpen && (
            <div className="bg-black w-[40%] h-125 rounded-xl text-white absolute top-0 mx-auto flex flex-row justify-center items-center">
              <input
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                type="text"
                placeholder="enter the name"
              />

              <button
                className="px-2 py-1 bg-green-400 mx-1 rounded-xl"
                onClick={() => setIsModalOpen(false)}
              >
                close
              </button>
              <button
                className="px-2 py-1 bg-green-400 mx-1 rounded-xl"
                onClick={() => handleRenameFile(id)}
              >
                save
              </button>
            </div>
          )}
          <br />
          <br />
        </div>
      ))}

      {directoryViewOnPage.map(({ name, id }) => (
        <div key={id}>
          {name}
          <div>
            <button onClick={() => navigate(`/directory/${id}`)}>open</button>
          </div>
          <button onClick={() => handleDeleteDirectory(id)}>delete</button>
          <button
            className="btn"
            onClick={() => {
              setDirectoryName(name);
              document.getElementById("my_modal_3").showModal();
            }}
          >
            rename
          </button>
          <dialog id="my_modal_3" className="modal">
            <div className="modal-box">
              <input
                value={newDirectoryName}
                onChange={(e) => setNewDirectoryName(e.target.value)}
                type="text"
                className="inp"
              />
              <button onClick={() => handleRenameDirectory(id)}>save</button>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </div>
      ))}

      <ToastContainer />
    </div>
  );
}

export default DirectoryView;
