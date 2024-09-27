import React from "react";

const AlertMessage = ({ type, message }) => {
  return (
    <div
      className={`alert alert-${type} alert-dismissible fade show`}
      role="alert"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "90%",
        maxWidth: "500px",
      }}
    >
      {message}
      <button
        type="button"
        className="btn-close"
        data-bs-dismiss="alert"
        aria-label="Close"
      ></button>
    </div>
  );
};

export default AlertMessage;
