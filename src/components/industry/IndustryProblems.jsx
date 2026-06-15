import { AlertTriangle } from 'lucide-react';

export default function IndustryProblems({ problems }) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {problems.map((problem, idx) => (
        <div
          key={idx}
          className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">{problem.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {problem.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}