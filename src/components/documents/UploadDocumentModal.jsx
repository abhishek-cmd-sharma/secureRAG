import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Shield, Lock } from 'lucide-react';

export function UploadDocumentModal({ isOpen, onClose }) {
  const { addDocument, currentUser } = useApp();

  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [accessLevel, setAccessLevel] = useState('Internal');
  const [summary, setSummary] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setDocName(selected.name);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setDocName(selected.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docName.trim()) {
      setError('Please provide a document title.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setError('');

    try {
      const ext = docName.split('.').pop().toUpperCase();
      const type = ['PDF', 'DOCX', 'TXT', 'MD'].includes(ext) ? ext : 'PDF';

      setUploadProgress(50);
      const success = await addDocument({
        name: docName.trim(),
        file: file,
        type,
        size: file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '2.1 MB',
        orgId: currentUser.orgId,
        orgName: currentUser.orgName,
        owner: currentUser.name,
        accessLevel,
        summary: summary.trim() || 'Enterprise operational documentation indexed into tenant vector collection.',
        excerpt: `Ingested document content for ${docName}. Automated chunking split the document into vector segments. Encrypted using tenant KMS master key.`
      });

      if (success !== false) {
        setUploadProgress(100);
        setFile(null);
        setDocName('');
        setSummary('');
        setUploadProgress(0);
        onClose();
      } else {
        setError('Upload failed. Please check server connection.');
      }
    } catch (err) {
      setError(err.message || 'Document upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) onClose();
      }}
      title="Upload Knowledge Document"
      description="Ingest, parse, and generate encrypted vector embeddings for enterprise RAG."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : file
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
          }`}
        >
          {file ? (
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-xs">{file.name}</p>
                  <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready for vector pipeline</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Drag and drop your file here, or{' '}
                <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer underline">
                  browse files
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: PDF, DOCX, TXT, MD (Max 50MB)
              </p>
            </div>
          )}
        </div>

        {/* Document Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Name
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            required
            placeholder="e.g. Q4 Compliance Guidelines.pdf"
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Security Access Classification */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Security Classification (RBAC)
            </label>
            <span className="text-[10px] text-slate-400">Controls who can query this file</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { level: 'Public', desc: 'All employees & contractors' },
              { level: 'Internal', desc: 'Standard staff & managers' },
              { level: 'Confidential', desc: 'Managers & admins only' },
              { level: 'Restricted', desc: 'Executive clearance only' }
            ].map(item => (
              <button
                key={item.level}
                type="button"
                onClick={() => setAccessLevel(item.level)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  accessLevel === item.level
                    ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.level}</span>
                  {accessLevel === item.level && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Brief Summary */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Knowledge Summary (Optional)
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="Brief overview of contents to assist retrieval ranking..."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Upload Progress Bar if active */}
        {isUploading && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Parsing text & generating 768d vector embeddings...
              </span>
              <span className="text-indigo-600 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Ingesting Vectors...' : 'Upload & Index'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
