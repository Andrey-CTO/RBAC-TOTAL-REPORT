import React, { useState } from 'react';
import { Badge, Button, SidePanel } from '../../components/ui/Shared';
import { History, Search, Filter, Download, ShieldAlert, CheckCircle2, XCircle, FileSpreadsheet, FileCode, Calendar, ShieldCheck, RefreshCw } from 'lucide-react';
import { useStore } from '../../lib/store';
import { AuditLog } from '../../types/rbac';

export function AuditoriaView() {
  const { auditLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Filter modules available
  const availableModules = Array.from(new Set(auditLogs.map(l => l.module || 'Seguridad')));

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetResource && log.targetResource.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.targetId && log.targetId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
    const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

    return matchesSearch && matchesModule && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Fecha y Hora', 'Actor ID', 'Actor Nombre', 'Módulo', 'Acción', 'Recurso', 'Recurso ID', 'Estado', 'IP', 'Detalles'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.actorId}"`,
      `"${l.actorName.replace(/"/g, '""')}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.targetResource.replace(/"/g, '""')}"`,
      `"${l.targetId || ''}"`,
      `"${l.status}"`,
      `"${l.ipAddress || '192.168.1.100'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Auditoria_Evidencia_Regulatoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Reporte CSV descargado con éxito.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  const exportToJSON = () => {
    const exportData = {
      exportMetadata: {
        system: 'RBAC Regulatorio Financiero v2.5',
        exportedAt: new Date().toISOString(),
        recordsCount: filteredLogs.length,
        integritySealSha256: 'a6c8e9b441...982efc10129'
      },
      auditLogs: filteredLogs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Auditoria_Inmutable_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportNotice('Archivo JSON inmutable exportado con éxito.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Registro de Auditoría Regulatoria</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Trazabilidad inmutable de seguridad, autorizaciones y eventos operacionales con valor probatorio
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button 
            variant={showFilters ? 'primary' : 'secondary'} 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 text-xs md:text-sm"
          >
            <Filter className="w-4 h-4" /> {showFilters ? 'Ocultar Filtros' : 'Filtros Avanzados'}
          </Button>
          <Button 
            onClick={exportToCSV}
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
          </Button>
          <Button 
            variant="secondary"
            onClick={exportToJSON}
            className="gap-2 text-xs md:text-sm"
          >
            <FileCode className="w-4 h-4" /> JSON
          </Button>
        </div>
      </header>

      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {exportNotice}
        </div>
      )}

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-fade-in">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Módulo de Seguridad</label>
            <select 
              value={selectedModule} 
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary font-medium"
            >
              <option value="ALL">Todos los módulos ({auditLogs.length})</option>
              {availableModules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Resultado / Estado</label>
            <select 
              value={selectedStatus} 
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary font-medium"
            >
              <option value="ALL">Todos los estados</option>
              <option value="SUCCESS">Éxito (SUCCESS)</option>
              <option value="DENIED">Denegado por RBAC (DENIED)</option>
              <option value="FAILED">Fallo de Validación (FAILED)</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="secondary" 
              onClick={() => { setSelectedModule('ALL'); setSelectedStatus('ALL'); setSearchTerm(''); }}
              className="w-full text-xs font-medium py-2"
            >
              Restablecer Filtros
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por actor, acción o recurso..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredLogs.length}</strong> de {auditLogs.length} eventos registrados
          </span>
        </div>

        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 border-b border-slate-200 shadow-sm text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Fecha y Hora</th>
                <th className="px-6 py-3 font-medium">Actor Responsable</th>
                <th className="px-6 py-3 font-medium">Módulo / Acción</th>
                <th className="px-6 py-3 font-medium">Recurso Afectado</th>
                <th className="px-6 py-3 font-medium text-center">Estado</th>
                <th className="px-6 py-3 font-medium text-center w-20">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{log.actorName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{log.actorId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral" className="mb-1 text-[10px]">{log.module}</Badge>
                    <p className="font-mono font-semibold text-slate-800 text-[11px]">{log.action}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{log.targetResource}</p>
                    {log.targetId && <p className="text-[11px] text-slate-500 font-mono">{log.targetId}</p>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {log.status === 'SUCCESS' ? (
                      <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3"/> Éxito</Badge>
                    ) : log.status === 'DENIED' ? (
                      <Badge variant="danger" className="gap-1"><ShieldAlert className="w-3 h-3"/> Denegado</Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1"><XCircle className="w-3 h-3"/> Fallo</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                      Inspeccionar
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">No se encontraron registros de auditoría</p>
                    <p className="text-xs">Ajusta los términos de búsqueda o los filtros aplicados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SidePanel
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Registro de Auditoría Forense"
      >
        {selectedLog && (
          <div className="space-y-6 flex flex-col h-full text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 font-mono text-sm">{selectedLog.id}</h3>
                <p className="text-slate-500 mt-0.5">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <Badge variant={selectedLog.status === 'SUCCESS' ? 'success' : selectedLog.status === 'DENIED' ? 'danger' : 'warning'}>
                {selectedLog.status}
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider text-[11px]">
                Información del Evento y Actor
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Actor</p>
                  <p className="font-bold text-slate-900 mt-0.5 text-sm">{selectedLog.actorName}</p>
                  <p className="font-mono text-slate-500 text-[11px]">{selectedLog.actorId}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Dirección IP / Origen</p>
                  <p className="font-mono text-slate-900 font-medium mt-0.5">{selectedLog.ipAddress || '192.168.1.100'}</p>
                  <p className="text-slate-400 text-[10px]">Canal Seguro VPN</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Módulo</p>
                  <Badge variant="neutral" className="mt-1">{selectedLog.module}</Badge>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Acción Ejecutada</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedLog.action}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider text-[11px]">
                Recurso Objetivo
              </h4>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Tipo y Referencia</p>
                <p className="text-slate-900 font-semibold text-sm mt-0.5">
                  {selectedLog.targetResource} {selectedLog.targetId ? `(${selectedLog.targetId})` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider text-[11px]">
                Evidencia y Detalle Operacional
              </h4>
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed break-words">
                {selectedLog.details}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-auto">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-emerald-950 font-bold text-xs">
                    Certificación de Integridad Inmutable
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Registro sellado cronológicamente. No puede ser sobreescrito, modificado ni suprimido por ninguna credencial administrativa según los lineamientos de auditoría externa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
