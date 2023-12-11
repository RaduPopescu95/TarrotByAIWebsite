import React, { useState } from "react";
import dynamic from "next/dynamic"; // Importă funcția dynamic pentru încărcarea dinamică
import "react-quill/dist/quill.snow.css"; // Stilurile pentru editor

// Importă ReactQuill în mod dinamic pentru a fi utilizat doar în client
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false, // Dezactivează încărcarea în timpul construcției (server-side rendering)
});

const ArticleEditor = (props) => {
  return (
    <div style={{ width: "100%", height: "auto" }}>
      <ReactQuill
        style={{ height: 300, marginBottom: 40 }}
        value={props.content}
        onChange={props.handleContentChange}
        theme="snow"
        modules={{
          toolbar: [
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ size: [] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [
              { list: "ordered" },
              { list: "bullet" },
              { indent: "-1" },
              { indent: "+1" },
            ],
            ["link", "image", "video"],
            ["clean"],
          ],
        }}
        formats={[
          "header",
          "font",
          "size",
          "bold",
          "italic",
          "underline",
          "strike",
          "blockquote",
          "list",
          "bullet",
          "indent",
          "link",
          "image",
          "video",
        ]}
        placeholder="Enter your text here..."
        readOnly={false}
      />
    </div>
  );
};

export default ArticleEditor;
