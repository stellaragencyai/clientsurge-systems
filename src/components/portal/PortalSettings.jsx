import { useEffect, useMemo, useState } from "react";
import { CalendarDays, HeartPulse, Loader2, Save, Webhook } from "lucide-react";
import { base44 } from "@/api/base44Client";
import WebhookSettings from "./WebhookSettings";

const SETTINGS_SECTIONS = [
  { id: "timeline", label: "Timeline", icon: CalendarDays },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
];

function formatDisplayDate(value) {
  if (!value) {
    return "Add date";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateLifeSpanLabel(birthDate, deathDate) {
  if (!birthDate) {
    return "Add a birth date to generate the life line";
  }

  const birth = new Date(`${birthDate}T00:00:00`);
  const end = deathDate ? new Date(`${deathDate}T00:00:00`) : new Date();

  if (Number.isNaN(birth.getTime()) || Number.isNaN(end.getTime()) || end < birth) {
    return "Timeline dates need a quick review";
  }

  let years = end.getFullYear() - birth.getFullYear();
  const monthDelta = end.getMonth() - birth.getMonth();
  const dayDelta = end.getDate() - birth.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    years -= 1;
  }

  return deathDate ? `${Math.max(years, 0)} years lived` : `${Math.max(years, 0)} years so far`;
}

function TimelineEndpoint({ title, date, align }) {
  return (
    <div className={`relative z-10 flex w-28 flex-col ${align === "right" ? "items-end text-right" : "items-start text-left"}`}>
      <div
        className="mb-3 h-7 w-7 rounded-full border-[6px] bg-white"
        style={{ borderColor: "#c8965c" }}
      />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{date}</p>
    </div>
  );
}

function TimelineVisualization({ values }) {
  const personName = values.timeline_person_name?.trim() || "Life timeline";
  const rightLabel = values.timeline_death_date ? "Death" : "Present";
  const lifeSpanLabel = calculateLifeSpanLabel(
    values.timeline_birth_date,
    values.timeline_death_date
  );

  return (
    <div
      className="rounded-[28px] border p-6 md:p-8"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,245,240,0.94) 100%)",
        borderColor: "rgba(154,92,46,0.18)",
        minHeight: "380px",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Timeline
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">
            {personName}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            A clean horizontal life line with editable birth and death dates.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
          style={{ background: "rgba(154,92,46,0.08)", color: "#7a4825" }}
        >
          <HeartPulse className="h-4 w-4" />
          {lifeSpanLabel}
        </div>
      </div>

      <div className="mt-16 flex min-h-[220px] items-center">
        <div className="relative w-full px-4 md:px-8">
          <div
            className="absolute left-6 right-6 top-1/2 h-[6px] -translate-y-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(122,72,37,0.95) 0%, rgba(200,150,92,0.95) 50%, rgba(122,72,37,0.95) 100%)",
              boxShadow: "0 10px 30px rgba(122,72,37,0.18)",
            }}
          />

          <div className="relative flex items-center justify-between gap-6">
            <TimelineEndpoint
              title="Birth"
              date={formatDisplayDate(values.timeline_birth_date)}
              align="left"
            />
            <div className="flex flex-col items-center">
              <div
                className="mb-3 rounded-full border px-4 py-2 text-xs font-semibold text-foreground"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  borderColor: "rgba(154,92,46,0.18)",
                }}
              >
                {lifeSpanLabel}
              </div>
              <div
                className="h-6 w-6 rounded-full border-[5px] bg-white"
                style={{ borderColor: "#9a5c2e" }}
              />
            </div>
            <TimelineEndpoint
              title={rightLabel}
              date={values.timeline_death_date ? formatDisplayDate(values.timeline_death_date) : "Still living"}
              align="right"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

export default function PortalSettings({ project, user, onUpdated }) {
  const [activeSection, setActiveSection] = useState("timeline");
  const [values, setValues] = useState({
    contact_email: "",
    timeline_person_name: "",
    timeline_birth_date: "",
    timeline_death_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setValues({
      contact_email: project?.contact_email || project?.client_email || user?.email || "",
      timeline_person_name: project?.timeline_person_name || project?.client_name || "",
      timeline_birth_date: project?.timeline_birth_date || "",
      timeline_death_date: project?.timeline_death_date || "",
    });
  }, [
    project?.contact_email,
    project?.client_email,
    project?.client_name,
    project?.timeline_birth_date,
    project?.timeline_death_date,
    project?.timeline_person_name,
    user?.email,
  ]);

  const lineCompletionText = useMemo(() => {
    if (values.timeline_birth_date && values.timeline_death_date) {
      return "Birth and death dates are both set.";
    }

    if (values.timeline_birth_date) {
      return "Birth date is set. Add a death date when needed.";
    }

    return "Add at least a birth date to draw the timeline accurately.";
  }, [values.timeline_birth_date, values.timeline_death_date]);

  const handleChange = (field, nextValue) => {
    setValues((current) => ({ ...current, [field]: nextValue }));
    setSuccess("");
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      if (
        values.timeline_birth_date &&
        values.timeline_death_date &&
        values.timeline_death_date < values.timeline_birth_date
      ) {
        throw new Error("Death date must be later than or equal to birth date.");
      }

      const response = await base44.functions.invoke("updatePortalTimeline", {
        contact_email: values.contact_email,
        timeline_person_name: values.timeline_person_name,
        timeline_birth_date: values.timeline_birth_date,
        timeline_death_date: values.timeline_death_date,
      });

      if (response?.project) {
        setValues({
          contact_email: response.project.contact_email || response.project.client_email || user?.email || "",
          timeline_person_name: response.project.timeline_person_name || project?.client_name || "",
          timeline_birth_date: response.project.timeline_birth_date || "",
          timeline_death_date: response.project.timeline_death_date || "",
        });
      }

      onUpdated?.();
      setSuccess("Timeline saved.");
    } catch (saveError) {
      setError(
        saveError?.data?.error ||
          saveError?.message ||
          "Unable to save timeline."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-[26px] border border-border bg-white p-4 shadow-sm h-fit">
        <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </p>
        <div className="space-y-2">
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = section.id === activeSection;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
                style={
                  isActive
                    ? {
                        background: "rgba(154,92,46,0.08)",
                        boxShadow: "inset 0 0 0 1px rgba(154,92,46,0.14)",
                      }
                    : undefined
                }
              >
                <span>{section.label}</span>
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-6">
        {activeSection === "timeline" && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <TimelineVisualization values={values} />

            <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Edit Timeline
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Update the email address, person name, birth date, and death date.
                </p>
              </div>

              <div className="space-y-5">
                <Field
                  label="Email Address"
                  value={values.contact_email}
                  onChange={(event) => handleChange("contact_email", event.target.value)}
                  placeholder="Enter the email address"
                  type="email"
                />

                <Field
                  label="Person Name"
                  value={values.timeline_person_name}
                  onChange={(event) => handleChange("timeline_person_name", event.target.value)}
                  placeholder="Enter the person's name"
                  type="text"
                />

                <Field
                  label="Birth Date"
                  value={values.timeline_birth_date}
                  onChange={(event) => handleChange("timeline_birth_date", event.target.value)}
                  type="date"
                />

                <Field
                  label="Death Date"
                  value={values.timeline_death_date}
                  onChange={(event) => handleChange("timeline_death_date", event.target.value)}
                  type="date"
                />
              </div>

              <div
                className="mt-6 rounded-2xl border px-4 py-3 text-sm"
                style={{
                  background: "rgba(154,92,46,0.06)",
                  borderColor: "rgba(154,92,46,0.12)",
                }}
              >
                <p className="font-semibold text-foreground">Life line status</p>
                <p className="mt-1 text-muted-foreground">{lineCompletionText}</p>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Timeline"}
              </button>
            </div>
          </div>
        )}

        {activeSection === "webhooks" && (
          <WebhookSettings project={project} />
        )}
      </div>
    </div>
  );
}