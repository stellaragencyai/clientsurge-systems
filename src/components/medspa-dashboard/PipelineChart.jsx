import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STAGE_COLORS = {
  New: "#94a3b8",
  Qualified: "#60a5fa",
  Contacted: "#fbbf24",
  Responded: "#34d399",
  Booked: "#22c55e",
  Closed: "#16a34a",
  Rejected: "#f87171",
};

export default function PipelineChart({ leads }) {
  const stages = ["New", "Qualified", "Contacted", "Responded", "Booked", "Closed", "Rejected"];
  const data = stages.map(stage => ({
    stage,
    count: leads.filter(l => l.status === stage).length,
  })).filter(d => d.count > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Pipeline by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No lead data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barSize={36}>
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={STAGE_COLORS[entry.stage] || "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
// @ts-nocheck
