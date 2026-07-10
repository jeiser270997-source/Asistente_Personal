'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, Car, Briefcase, GraduationCap, LayoutDashboard, Database, Activity } from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.error) {
          throw new Error(json.error);
        }
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando estado:', err);
        setError(err.message || 'Error de conexión');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <Activity className="w-10 h-10 text-emerald-600 mb-4 animate-spin" />
          <h1 className="text-slate-400 font-mono text-sm tracking-widest uppercase font-bold">Cargando LifeOS...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl max-w-md w-full text-center shadow-md">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-red-950 font-bold text-lg mb-2">Error de Conexión</h1>
          <p className="text-red-700 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 p-4 md:p-8 font-sans selection:bg-emerald-200/50">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
            <LayoutDashboard className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">LifeOS Dashboard</h1>
            <p className="text-slate-500 text-sm font-mono mt-1">Centro de Mando Personal • Sistema Unificado</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">Sistema Activo</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* SIMIT & Legal Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Legal & Tránsito</h2>
          </div>
          <div className="space-y-4">
            {data?.ledger?.casos_legales?.slice(0,4).map((caso: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 pb-3 last:border-0">
                <span className="text-slate-700 font-medium truncate pr-4">{caso.id || caso.entidad}</span>
                <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full border font-bold ${caso.estado?.toLowerCase().includes('cerrado') || caso.estado?.toLowerCase().includes('favorable') ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-amber-50 text-amber-700 border-amber-200/50'}`}>
                  {caso.estado}
                </span>
              </div>
            )) || <p className="text-sm text-slate-500">No hay datos legales.</p>}
          </div>
        </div>

        {/* Computrabajo Jobs */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">QA Job Hunter</h2>
          </div>
          <div className="mb-4 flex items-baseline gap-1.5">
            <span className="text-5xl font-bold text-slate-900 tracking-tight">{data?.jobs?.total || 0}</span>
            <span className="text-slate-500 text-sm">ofertas en cola</span>
          </div>
          <div className="space-y-3">
            {data?.jobs?.next?.map((job: any, i: number) => (
              <div key={i} className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-100/80">
                <p className="font-semibold text-slate-800 truncate">{job.titulo}</p>
                <p className="text-slate-500 truncate mt-1">{job.empresa || job.fecha}</p>
                <div className="flex justify-between items-center mt-2.5">
                   <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold border border-emerald-100">Score: {job.auditoria?.score || '?'}</span>
                   <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium truncate max-w-[120px]">{job.ubicacion || job.lugar || 'Medellín'}</span>
                </div>
              </div>
            )) || <p className="text-sm text-slate-500">No hay ofertas en cola.</p>}
          </div>
        </div>

        {/* DiDi & Finanzas */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Car className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Finanzas DiDi</h2>
          </div>
          <div className="space-y-6">
            <div>
               <p className="text-slate-500 text-sm mb-1">Deuda DIAN Estimada</p>
               <p className="text-3xl font-mono font-bold text-rose-600">${data?.finances?.dianDebt || '0'}</p>
            </div>
            <div className="p-4 bg-amber-50/50 border border-amber-200/50 text-amber-900 rounded-xl leading-relaxed text-xs">
                <p className="font-medium text-amber-800">
                  Recuerda: Los días pico para conducir son Viernes y Sábado. No firmes el formulario 814 de la DIAN sin revisión.
                </p>
            </div>
          </div>
        </div>

        {/* Académico */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Estudios (SENA/CESDE)</h2>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/80">
             <h3 className="text-sm font-semibold text-purple-700 mb-1.5">CESDE - QA Automation</h3>
             <p className="text-xs text-slate-500 leading-relaxed">Progreso activo. Recuerda actualizar tu CV con los proyectos del bootcamp.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 mt-4">
             <h3 className="text-sm font-semibold text-purple-700 mb-1.5">SENA - Bases de Datos</h3>
             <p className="text-xs text-slate-500 leading-relaxed">{data?.senaStatus || 'Verificando Zajuna...'}</p>
          </div>
        </div>

        {/* Memoria Reciente */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Database className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Memoria Reciente (Hipocampo)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.memorias?.slice(0,4).map((mem: any, i: number) => (
              <div key={i} className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2 leading-relaxed">
                <span className="text-emerald-700 font-mono text-[10px] uppercase tracking-wider font-bold">{mem.categoria}</span>
                <p className="text-slate-600 line-clamp-3">{mem.descripcion || mem.hecho}</p>
              </div>
            )) || <p className="text-sm text-slate-500">No hay memorias recientes.</p>}
          </div>
        </div>
      </main>
      
      <ChatInterface />
    </div>
  );
}
