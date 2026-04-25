import { BookMarked, BookOpenText, GraduationCap, Library, Target, TrendingUp } from 'lucide-react';
import { useUserProgress } from '../hooks/useUserProgress';

function statusLabel(status: 'idle' | 'active' | 'done'): string {
  if (status === 'done') return 'Concluído';
  if (status === 'active') return 'Em Andamento';
  return 'Aguardando';
}

const GOAL_ICON = {
  biblia: BookOpenText,
  mana: GraduationCap,
  matrix: BookMarked,
  livraria: Library,
};

export default function ProgressSection() {
  const { overallPct, pillars, goals } = useUserProgress();

  return (
    <section className="px-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} className="text-primary" />
        <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
          Meu Progresso
        </span>
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-5 mb-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-on-surface">Progresso Geral</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
              Acompanhe o que você mais lê: Bíblia, BABEL, SELAH e MANÁ.
            </p>
          </div>
          <span className="font-headline text-2xl font-black text-primary tracking-tighter">
            {overallPct}%
          </span>
        </div>

        <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {pillars.map(({ label, pct }) => (
            <div key={label} className="flex flex-col gap-1.5 items-center">
              <div className="w-full h-16 bg-surface-container-high rounded-lg overflow-hidden flex items-end">
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-orange-500 to-yellow-400 transition-all duration-700"
                  style={{ height: `${Math.max(4, pct)}%` }}
                />
              </div>
              <span className="text-[8px] font-black uppercase tracking-tight text-on-surface-variant/60 text-center leading-tight">
                {label}
              </span>
              <span className="text-[9px] font-black text-primary leading-none">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-primary" />
          <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            Metas da Semana
          </span>
        </div>
        <p className="text-[10px] text-on-surface-variant/65 mb-4 leading-relaxed">
          Progresso com foco: 1 estudo bíblico por semana, 1 MANÁ por dia e 1 série por semana em SELAH e BABEL.
        </p>

        <div className="space-y-3">
          {goals.map((goal) => {
            const Icon = GOAL_ICON[goal.key as keyof typeof GOAL_ICON] ?? Target;
            const badgeClass = goal.status === 'done'
              ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/35'
              : goal.status === 'active'
                ? 'text-primary bg-primary/10 border-primary/35'
                : 'text-on-surface-variant/60 bg-surface-container-high border-outline-variant/20';

            const barClass = goal.status === 'done'
              ? 'from-[#D4AF37] to-[#F5D76E]'
              : 'from-orange-500 to-yellow-400';

            return (
              <article
                key={goal.key}
                className="rounded-xl border border-outline-variant/15 bg-surface-container-high/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-on-surface">
                        {goal.label}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/60">
                        Meta: {goal.target}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${badgeClass}`}>
                    {statusLabel(goal.status)}
                  </span>
                </div>

                <p className="mt-2 text-[10px] text-on-surface-variant/80">{goal.summary}</p>

                <div className="mt-2 h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all duration-700`}
                    style={{ width: `${goal.progressPct}%` }}
                  />
                </div>

                <p className="mt-1.5 text-[9px] text-on-surface-variant/60 leading-snug">
                  {goal.hint}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
