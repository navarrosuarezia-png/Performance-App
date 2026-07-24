import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="py-4 space-y-4">
      <h2 className="text-xl font-bold">Reportes</h2>
      <p className="text-sm text-slate-400">Consolidados y cierres</p>

      <Card>
        <CardHeader>
          <CardTitle icon={FileText}>Reportes Semanales</CardTitle>
        </CardHeader>
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          Los reportes se implementarán en la Fase 4
        </div>
      </Card>
    </div>
  );
}
