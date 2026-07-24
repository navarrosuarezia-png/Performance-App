import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { LayoutDashboard, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { GLYGauge } from '@/components/GLYGauge';

export default function DashboardPage() {
  return (
    <div className="py-4 space-y-4">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <p className="text-sm text-slate-400">Vista consolidada de producción</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <div className="text-center">
            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">2,847</p>
            <p className="text-xs text-slate-400">HL Hoy</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <GLYGauge value={78.5} size="sm" />
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-slate-400">Incidencias</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">42</p>
            <p className="text-xs text-slate-400">Min. Paro</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle icon={LayoutDashboard}>Producción por Hora</CardTitle>
        </CardHeader>
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          Gráficas de producción se implementarán en la Fase 3
        </div>
      </Card>
    </div>
  );
}
