'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, Car, Briefcase, GraduationCap, LayoutDashboard, Database, Activity } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="w-10 h-10 text-emerald-500 mb-4 animate-spin" />
          <h1 className="text-neutral-400 font-mono text-sm tracking-widest uppercase">Cargando LifeOS...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">LifeOS Dashboard</h1>
            <p className="text-neutral-500 text-sm font-mono mt-1">Centro de Mando Personal • Sistema Unificado</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider">Sistema Activo</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* SIMIT & Legal Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl hover:border-neutral-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Legal & Tránsito</h2>
          </div>
          <div className="space-y-4">
            {data?.ledger?.slice(0,4).map((caso: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-neutral-800/50 pb-3 last:border-0">
                <span className="text-neutral-400 truncate pr-4">{caso.id || caso.entidad}</span>
                <span className={`font-mono text-[10px] px-2 py-1 rounded-full ${caso.estado?.toLowerCase().includes('cerrado') || caso.estado?.toLowerCase().includes('favorable') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {caso.estado}
                </span>
              </div>
            )) || <p className="text-sm text-neutral-500">No hay datos legales.</p>}
          </div>
        </div>

        {/* Computrabajo Jobs */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl hover:border-neutral-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">QA Job Hunter</h2>
          </div>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{data?.jobs?.total || 0}</span>
            <span className="text-neutral-500 text-sm">ofertas pendientes</span>
          </div>
          <div className="space-y-3">
            {data?.jobs?.next?.map((job: any, i: number) => (
              <div key={i} className="text-xs bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <p className="font-semibold text-neutral-200 truncate">{job.titulo}</p>
                <p className="text-neutral-500 truncate mt-1">{job.empresa}</p>
                <div className="flex justify-between items-center mt-2">
                   <span className="text-emerald-500 font-mono">Score: {job.score || '?'}</span>
                   <span className="text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded truncate max-w-[120px]">{job.ubicacion || 'Remoto'}</span>
                </div>
              </div>
            )) || <p className="text-sm text-neutral-500">No hay ofertas en cola.</p>}
          </div>
        </div>

        {/* DiDi & Finanzas */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl hover:border-neutral-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Car className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Finanzas DiDi</h2>
          </div>
          <div className="space-y-6">
            <div>
               <p className="text-neutral-500 text-sm mb-1">Deuda DIAN Estimada</p>
               <p className="text-2xl font-mono text-red-400">${data?.finances?.dianDebt || '0'}</p>
            </div>
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <p className="text-amber-200/70 text-xs leading-relaxed">
                  Recuerda: Los días pico para conducir son Viernes y Sábado. No firmes el formulario 814 de la DIAN sin revisión.
                </p>
            </div>
          </div>
        </div>

        {/* Académico */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl hover:border-neutral-700 transition-colors md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Estudios (SENA/CESDE)</h2>
          </div>
          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
             <h3 className="text-sm font-semibold text-purple-400 mb-2">CESDE - QA Automation</h3>
             <p className="text-xs text-neutral-400">Progreso activo. Recuerda actualizar tu CV con los proyectos del bootcamp.</p>
          </div>
          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 mt-4">
             <h3 className="text-sm font-semibold text-purple-400 mb-2">SENA - Bases de Datos</h3>
             <p className="text-xs text-neutral-400">Tareas extraídas vía Zajuna. Verifica alertas locales para entregas.</p>
          </div>
        </div>

        {/* Memoria Reciente */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl hover:border-neutral-700 transition-colors md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100/10 rounded-lg">
              <Database className="w-5 h-5 text-neutral-300" />
            </div>
            <h2 className="text-lg font-semibold text-white">Memoria Reciente (Hipocampo)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.memorias?.slice(0,4).map((mem: any, i: number) => (
              <div key={i} className="text-xs bg-neutral-950 p-4 rounded-lg border border-neutral-800 flex flex-col gap-2">
                <span className="text-emerald-500/70 font-mono text-[10px] uppercase tracking-wider font-bold">{mem.categoria}</span>
                <p className="text-neutral-300 line-clamp-3 leading-relaxed">{mem.descripcion || mem.hecho}</p>
              </div>
            )) || <p className="text-sm text-neutral-500">No hay memorias recientes.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
