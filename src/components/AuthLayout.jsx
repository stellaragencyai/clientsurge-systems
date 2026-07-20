import React from "react";
import { ShieldCheck } from "lucide-react";
import "@/styles/clientsurge-os-auth-layout.css";

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
  brandTitle = "Secure access to the system running your growth.",
  brandDescription = "Recover your account without leaving the protected ClientSurge experience. Your activation, services, reporting, billing, and support remain connected to one identity.",
  assurance = "Protected account recovery and identity verification.",
}) {
  return (
    <main className="cs-auth-layout">
      <section className="cs-auth-layout__brand" aria-label="ClientSurge secure access">
        <div className="cs-auth-layout__brand-lockup" aria-label="ClientSurge Systems">
          <span className="cs-auth-layout__brand-mark" aria-hidden="true">CS</span>
          <span>ClientSurge Systems</span>
        </div>

        <div className="cs-auth-layout__brand-copy">
          <h2>{brandTitle}</h2>
          <p>{brandDescription}</p>
        </div>

        <div className="cs-auth-layout__assurance">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{assurance}</span>
        </div>
      </section>

      <section className="cs-auth-layout__workspace">
        <div className="cs-auth-layout__panel">
          <header className="cs-auth-layout__heading">
            {Icon ? <span className="cs-auth-layout__icon"><Icon size={22} aria-hidden="true" /></span> : null}
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </header>

          <div className="cs-auth-layout__card">{children}</div>
          {footer ? <p className="cs-auth-layout__footer">{footer}</p> : null}
        </div>
      </section>
    </main>
  );
}
