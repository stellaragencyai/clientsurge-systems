import React from "react";
import { Link } from "react-router-dom";

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 px-6">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
            Client Portal Access
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Not Ready Yet</h1>
          <p className="text-slate-600 mb-8">
            This account is not currently linked to a ClientSurge portal. If you recently signed
            up or purchased a system, your portal may still be getting connected by our team.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 text-left">
            <p className="font-semibold text-slate-800 mb-2">Try these next steps:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verify you are logged in with the same email used for purchase</li>
              <li>Try signing out and back in once</li>
              <li>Contact ClientSurge if you expected portal access already</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
            >
              Back to Home
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
