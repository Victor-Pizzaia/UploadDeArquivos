import React, { useState } from "react";
import { uniqueId } from "lodash";
import filesize from "filesize";
import GlobalStyle from "./styles/global";
import api from "./services/api";
import { Container, Content } from "./styles";
import Upload from "./components/Upload/index";
import FileList from "./components/FileList/index";

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const componentDidMount = async () => {
    const response = await api.get("posts");

    setUploadedFiles(
      response.data.map((file) => ({
        id: file._id,
        name: file.name,
        readableSize: filesize(file.size),
        preview: file.url,
        uploaded: true,
        url: file.url,
      }))
    );
  };
  const handleUpload = (files) => {
    const upFiles = files.map((file) => ({
      file,
      id: uniqueId(),
      name: file.name,
      readableSize: filesize(file.size),
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: null,
    }));

    setUploadedFiles(uploadedFiles.concat(upFiles));

    upFiles.forEach(processUpload);
  };

  const updateFile = (id, data) => {
    setUploadedFiles(
      uploadedFiles.map((uploadedFile) => {
        return id === uploadedFile.id
          ? { ...uploadedFile, ...data }
          : uploadedFile;
      })
    );
  };
  const processUpload = (upFiles) => {
    const data = new FormData();
    data.append("file", upFiles.file, upFiles.name);

    api
      .post("/posts", data, {
        onUploadProgress: (e) => {
          const progress = parseInt(Math.round((e.loaded * 100) / e.total));
          updateFile(upFiles.id, {
            progress,
          });
        },
      })
      .then((response) => {
        updateFile(upFiles.id, {
          uploaded: true,
          id: response.data._id,
          url: response.data.url,
        });
      })
      .catch(() => {
        updateFile(upFiles.id, {
          error: true,
        });
      });
  };

  const handleDelete = async (id) => {
    await api.delete(`posts/${id}`);
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
  };

  const componentWillUnmount = () => {
    uploadedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
  };

  return (
    <Container>
      <Content>
        <Upload onUpload={handleUpload} />
        {!!uploadedFiles.length && (
          <FileList files={uploadedFiles} onDelete={handleDelete} />
        )}
      </Content>
      <GlobalStyle />
    </Container>
  );
}

export default App;
