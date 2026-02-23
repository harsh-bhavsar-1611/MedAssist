import React from "react";
import { ArrowRight, HeartPulse, ShieldCheck, Stethoscope, Sparkles } from "lucide-react";

const LandingPage = ({ onGoToLogin, onGoToRegister }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#dbeafe_0%,#fef3c7_35%,#f8fafc_70%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center shadow-md">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">MedAssist</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">AI Patient Interaction</p>
            </div>
          </div>
          <button
            onClick={onGoToLogin}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            Sign in
          </button>
        </header>

        <main className="mt-12 grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <section>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Faster Care Conversations
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              A smarter front desk for every patient question.
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
              MedAssist helps patients ask health questions, keeps conversation history organized, and gives your
              team cleaner context before every follow-up.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onGoToRegister}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onGoToLogin}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold transition hover:border-slate-400"
              >
                Login
              </button>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Built for trust</p>
              <div className="mt-5 space-y-4">
                <article className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold">Secure authentication</p>
                    <p className="text-sm text-slate-600">Google login, protected sessions, and account-safe chat access.</p>
                  </div>
                </article>
                <article className="flex gap-3">
                  <Stethoscope className="mt-1 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">Medical-first experience</p>
                    <p className="text-sm text-slate-600">Structured chat flow with clear patient context.</p>
                  </div>
                </article>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-900 p-6 text-slate-100 shadow-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Why teams choose MedAssist</p>
              <p className="mt-3 text-lg font-semibold">Clearer conversations, less triage noise, better patient confidence.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
