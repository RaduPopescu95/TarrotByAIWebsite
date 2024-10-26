const ModalComponent = ({ id, title, bodyContent, confirmText, cancelText, isVisible, onClose, onConfirm }) => (
    <div className={`modal fade ${isVisible ? "show" : ""}`} id={id} style={{ display: isVisible ? "block" : "none" }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}>
              {/* <i className="fa-solid fa-xmark" /> */}
            </button>
          </div>
          <div className="modal-body">{bodyContent}</div>
          <div className="modal-footer">
            <button className="btn btn-gray" onClick={onClose}>
              {cancelText}
            </button>
            {/* Asigurăm că onConfirm este apelat corect */}
            <button className="btn btn-primary prime-btn" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  export default ModalComponent;
  