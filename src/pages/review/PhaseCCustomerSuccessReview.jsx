import { AlertTriangle, CalendarClock, CheckCircle2, FileText, ShieldAlert, User } from "lucide-react";
import { phaseCCustomerSuccess } from "@/data/phaseCReviewFixtures";
import {
  ContractPill,
  DefinitionList,
  DeepLink,
  EvidenceList,
  PhaseCReviewShell,
  ReviewCard,
  SectionHeader,
} from "@/components/review/phase-c/PhaseCReviewComponents";

function statusTone(status) {
  if (["current", "complete"].includes(status)) return "verified";
  if (["blocked", "unknown"].includes(status)) return "unknown";
  if (["partial", "limited", "delayed"].includes(status)) return "delayed";
  return "reported";
}

function AccountCard({ account, risks }) {
  return (
    <ReviewCard
      id={`account-${account.id}`}
      title={account.customer}
      subtitle={`${account.plan} - owner: ${account.owner}`}
      icon={User}
      badge={<ContractPill label="Posture" value={account.currentPosture} tone="reported" />}
    >
      <div className="grid gap-4">
        <DefinitionList
          columns="lg:grid-cols-4"
          items={[
            { label: "Installation", value: account.installation.summary },
            { label: "Adoption", value: account.adoption.summary },
            { label: "AI usage", value: account.aiUsage.summary },
            { label: "Automation coverage", value: account.automationCoverage.summary },
            { label: "Success plan", value: account.successPlan.objective },
            { label: "Next milestone", value: account.successPlan.nextMilestone },
            { label: "Owner", value: account.owner },
            { label: "Renewal", value: account.renewal.summary },
          ]}
        />

        <div className="flex flex-wrap gap-2">
          <ContractPill label="Installation" value={account.installation.status} tone={statusTone(account.installation.status)} />
          <ContractPill label="Adoption" value={account.adoption.status} tone={statusTone(account.adoption.status)} />
          <ContractPill label="AI usage" value={account.aiUsage.status} tone={statusTone(account.aiUsage.status)} />
          <ContractPill label="Coverage" value={account.automationCoverage.status} tone={statusTone(account.automationCoverage.status)} />
          <ContractPill label="Renewal" value={account.renewal.state} tone={statusTone(account.renewal.state)} />
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-950">Account risk evidence</h4>
          <div className="mt-2 grid gap-3 lg:grid-cols-2">
            {risks.map((risk) => (
              <div key={risk.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ContractPill label="Priority" value={risk.priority} tone={risk.priority === "critical" ? "unknown" : "reported"} />
                  <ContractPill label="Owner" value={risk.owner} tone="reported" />
                </div>
                <p className="mt-2 text-sm font-bold text-slate-950">{risk.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{risk.nextAction}</p>
                <div className="mt-3">
                  <DeepLink to={`#risk-${risk.id}`}>Open risk</DeepLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ReviewCard>
  );
}

function RiskCard({ risk }) {
  return (
    <ReviewCard
      id={`risk-${risk.id}`}
      title={risk.title}
      subtitle={`${risk.accountId} - ${risk.relatedObject}`}
      icon={ShieldAlert}
      badge={<ContractPill label="Priority" value={risk.priority} tone={risk.priority === "critical" ? "unknown" : "reported"} />}
    >
      <div className="grid gap-4">
        <DefinitionList
          columns="lg:grid-cols-4"
          items={[
            { label: "Evidence", value: risk.evidence.map((item) => item.label).join(", ") },
            { label: "Reason", value: risk.reason },
            { label: "Impact", value: risk.impact },
            { label: "Owner", value: risk.owner },
            { label: "Next action", value: risk.nextAction },
            { label: "Related object", value: risk.relatedObject },
          ]}
        />
        <EvidenceList items={risk.evidence} />
      </div>
    </ReviewCard>
  );
}

export default function PhaseCCustomerSuccessReview() {
  const { accounts, risks } = phaseCCustomerSuccess;

  return (
    <PhaseCReviewShell
      activeKey="customer-success"
      eyebrow="Phase C Customer + AI Operations"
      title="Customer Success Workspace"
      summary="Fixture-backed customer success foundation for installation, adoption, AI usage, automation coverage, risk, success plans, owners, and renewal context. No numeric or unsupported health score is rendered."
    >
      <section aria-labelledby="customer-success-overview">
        <SectionHeader
          id="customer-success-overview"
          eyebrow="Customer Success Workspace"
          title="Success coverage"
          description="Each account shows tracked operational dimensions and evidence-backed posture labels without aggregating a health score."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReviewCard title="Accounts" subtitle="Fixture customers" icon={User}>
            <p className="text-3xl font-semibold text-slate-950">{accounts.length}</p>
            <p className="mt-1 text-sm text-slate-600">Each account tracks installation, adoption, AI usage, coverage, risk, success plan, owner, and renewal.</p>
          </ReviewCard>
          <ReviewCard title="Risks" subtitle="Evidence-backed" icon={AlertTriangle}>
            <p className="text-3xl font-semibold text-slate-950">{risks.length}</p>
            <p className="mt-1 text-sm text-slate-600">Every risk has evidence, reason, impact, owner, and next action.</p>
          </ReviewCard>
          <ReviewCard title="Health scores" subtitle="Unsupported" icon={ShieldAlert}>
            <p className="text-3xl font-semibold text-slate-950">0</p>
            <p className="mt-1 text-sm text-slate-600">The workspace uses qualitative posture until a defensible score contract exists.</p>
          </ReviewCard>
          <ReviewCard title="Review dates" subtitle="Success plans" icon={CalendarClock}>
            <p className="text-3xl font-semibold text-slate-950">3</p>
            <p className="mt-1 text-sm text-slate-600">Success plans include next milestone and review date.</p>
          </ReviewCard>
        </div>
      </section>

      <section aria-labelledby="customer-success-accounts">
        <SectionHeader
          id="customer-success-accounts"
          eyebrow="Accounts"
          title="Customer success workspace fixtures"
          description="Account cards prioritize current posture and operational next steps before passive reporting."
        />
        <div className="mt-4 grid gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              risks={risks.filter((risk) => risk.accountId === account.id)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="customer-success-risks">
        <SectionHeader
          id="customer-success-risks"
          eyebrow="Risk"
          title="Evidence-backed risk register"
          description="Risk records do not rely on a hidden score. The business reason, impact, owner, and next action are visible."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {risks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </section>

      <section aria-labelledby="customer-success-contract">
        <SectionHeader
          id="customer-success-contract"
          eyebrow="Score boundary"
          title="No unsupported health score"
          description="Phase C can show current posture, evidence gaps, and risk, but it does not calculate a health score until contributors, weighting, thresholds, stale-data treatment, and confidence policy are approved."
        />
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <ContractPill label="Score rendered" value="No" tone="reported" icon={CheckCircle2} />
            <ContractPill label="Risk evidence required" value="Yes" tone="verified" icon={FileText} />
            <ContractPill label="Renewal certainty" value="Source-backed only" tone="reported" />
          </div>
        </div>
      </section>
    </PhaseCReviewShell>
  );
}
