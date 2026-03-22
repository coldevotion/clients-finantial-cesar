'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api as apiClient } from '@/lib/api-client';
import {
  Upload, CheckCircle2, XCircle, Clock, Loader2,
  FileText, Trash2, AlertCircle, Download,
} from 'lucide-react';

interface BulkUpload {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  failedRows: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<BulkUpload['status'], { label: string; color: string; icon: React.FC<any> }> = {
  PENDING:    { label: 'Pendiente',   color: 'bg-slate-100 text-slate-500',     icon: Clock },
  PROCESSING: { label: 'Procesando',  color: 'bg-blue-500/10 text-blue-600',    icon: Loader2 },
  COMPLETED:  { label: 'Completado',  color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  FAILED:     { label: 'Fallido',     color: 'bg-red-500/10 text-danger',       icon: XCircle },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: uploads = [], isLoading } = useQuery<BulkUpload[]>({
    queryKey: ['bulk-uploads'],
    queryFn: () => apiClient.get<BulkUpload[]>('/bulk-uploads'),
    refetchInterval: 5000, // poll for status updates
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/bulk-uploads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-uploads'] }),
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    if (!allowed.includes(file.type)) {
      alert('Solo se permiten archivos CSV o Excel.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo no puede superar 20 MB.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await apiClient.postForm('/bulk-uploads', fd);
      qc.invalidateQueries({ queryKey: ['bulk-uploads'] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const stats = {
    total: uploads.length,
    completed: uploads.filter(u => u.status === 'COMPLETED').length,
    processing: uploads.filter(u => u.status === 'PROCESSING').length,
    failed: uploads.filter(u => u.status === 'FAILED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Upload size={24} className="text-primary-500" />
          Cargue masivo de bases de datos
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Sube archivos CSV o Excel para importar contactos en masa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total subidos', value: stats.total, color: 'text-text-primary' },
          { label: 'Completados', value: stats.completed, color: 'text-emerald-600' },
          { label: 'En proceso', value: stats.processing, color: 'text-blue-600' },
          { label: 'Fallidos', value: stats.failed, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="card px-4 py-3">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`card flex flex-col items-center justify-center py-14 cursor-pointer border-2 border-dashed transition-all
          ${dragging ? 'border-primary-500 bg-primary-500/5' : 'border-border hover:border-primary-400 hover:bg-surface-muted/40'}`}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={e => handleFiles(e.target.files)} />
        {uploading ? (
          <>
            <Loader2 size={36} className="text-primary-500 animate-spin mb-3" />
            <p className="font-semibold text-text-primary">Subiendo archivo…</p>
          </>
        ) : (
          <>
            <Upload size={36} className={dragging ? 'text-primary-500' : 'text-text-muted'} />
            <p className="font-semibold text-text-primary mt-3">
              {dragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
            </p>
            <p className="text-sm text-text-muted mt-1">CSV, XLS, XLSX — máximo 20 MB</p>
            <div className="mt-4 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-600 text-sm font-medium">
              Seleccionar archivo
            </div>
          </>
        )}
      </div>

      {/* Format guide */}
      <div className="card px-5 py-4 bg-blue-50 border-blue-100">
        <div className="flex gap-3">
          <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Formato esperado del archivo</p>
            <p>El archivo debe tener columnas: <code className="bg-blue-100 px-1 rounded text-xs">phone</code>, <code className="bg-blue-100 px-1 rounded text-xs">name</code> (opcional), <code className="bg-blue-100 px-1 rounded text-xs">metadata</code> (JSON, opcional).</p>
            <p className="mt-1">El teléfono debe estar en formato E.164: <code className="bg-blue-100 px-1 rounded text-xs">+573001234567</code></p>
          </div>
        </div>
      </div>

      {/* Upload history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Historial de cargas</h2>
          <span className="text-xs text-text-muted">Se actualiza automáticamente</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-surface-muted animate-pulse" />)}
          </div>
        ) : uploads.length === 0 ? (
          <div className="py-14 text-center text-text-muted">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin archivos subidos</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {uploads.map(u => {
              const cfg = STATUS_CONFIG[u.status];
              const Icon = cfg.icon;
              const pct = u.totalRows > 0 ? Math.round((u.processedRows / u.totalRows) * 100) : 0;

              return (
                <div key={u.id} className="px-5 py-4 flex items-center gap-4 hover:bg-surface-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-primary-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary truncate">{u.fileName}</p>
                      <span className={`badge ${cfg.color} gap-1 flex-shrink-0`}>
                        <Icon size={10} className={u.status === 'PROCESSING' ? 'animate-spin' : ''} />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                      <span>{formatBytes(u.fileSize)}</span>
                      {u.totalRows > 0 && (
                        <>
                          <span>{u.processedRows.toLocaleString()} / {u.totalRows.toLocaleString()} filas</span>
                          {u.failedRows > 0 && <span className="text-danger">{u.failedRows} errores</span>}
                        </>
                      )}
                      <span>{new Date(u.createdAt).toLocaleString('es-CO')}</span>
                    </div>

                    {/* Progress bar */}
                    {(u.status === 'PROCESSING' || u.status === 'COMPLETED') && u.totalRows > 0 && (
                      <div className="mt-2 h-1.5 bg-surface-muted rounded-full overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full transition-all ${u.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => confirm('¿Eliminar registro?') && deleteMutation.mutate(u.id)}
                    className="text-text-muted hover:text-danger transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
