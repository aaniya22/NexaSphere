import { useState, useRef } from 'react';

export default function ResumeUploader({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(f.type)) {
      setError('Please upload a PDF or DOC/DOCX file.');
      return;
    }
    setError('');
    setFile(f);
    onUpload(f);
  };

  return (
    <div
      className={`uploader-zone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {file ? (
        <div className="file-selected">
          <span className="file-icon">📄</span>
          <p className="file-name">{file.name}</p>
          <p className="file-hint">Click to change file</p>
        </div>
      ) : (
        <div className="upload-prompt">
          <span className="upload-icon">⬆</span>
          <p className="upload-title">Drop your resume here</p>
          <p className="upload-sub">PDF, DOC, or DOCX · Max 5MB</p>
        </div>
      )}
      {error && (
        <p className="upload-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
