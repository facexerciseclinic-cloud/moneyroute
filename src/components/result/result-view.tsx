"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ASSESSMENT_VERSION } from "@/lib/domain/questions";
import { MONEY_TYPES } from "@/lib/domain/money-types";
import { INCOME_ROUTES } from "@/lib/domain/income-routes";
import type { ScoreSnapshot } from "@/lib/domain/scoring";
import type { DimensionKey } from "@/lib/domain/dimensions";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { ScoreBar } from "@/components/ui/score-bar";
import { ButtonLink } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";

const STORAGE_KEY = `rmr_answers_${ASSESSMENT_VERSION}`;
const ANON_ID_KEY = "rmr_anon_id";

/** Stable per-browser anonymous id, so a session can be claimed later. */
function getAnonymousSessionId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const SCORE_CARDS: { label: string; key: DimensionKey }[] = [
  { label: "Speed Orientation", key: "income_urgency" },
  { label: "Visibility Tolerance", key: "visibility_tolerance" },
  { label: "Sales Tolerance", key: "sales_tolerance" },
  { label: "Creative Ability", key: "creative_production" },
  { label: "Capital Readiness", key: "capital_readiness" },
  { label: "Builder Horizon", key: "scale_ambition" },
];

const LOCKED_SECTIONS = [
  "เส้นทางที่เหมาะอันดับ 2 และ 3",
  "เส้นทางที่คุณไม่ควรเสียเวลา",
  "แผนทดลอง 7 วัน",
  "ข้อเสนอแรกและแผนหาลูกค้า",
  "Content Angles และ Risk Map",
  "Bridge Route และแผนสร้างสินทรัพย์ระยะยาว",
];

type State =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error" }
  | { status: "ready"; snapshot: ScoreSnapshot };

export default function ResultView() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      let answers: Record<string, string> | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) answers = JSON.parse(raw);
      } catch {
        /* ignore */
      }
      if (!answers || Object.keys(answers).length === 0) {
        if (!cancelled) setState({ status: "empty" });
        return;
      }
      try {
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            anonymousSessionId: getAnonymousSessionId(),
          }),
        });
        if (!res.ok) throw new Error("score failed");
        const data = (await res.json()) as { snapshot: ScoreSnapshot };
        if (!cancelled) setState({ status: "ready", snapshot: data.snapshot });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <Centered>
        <p className="text-muted">กำลังคำนวณผลลัพธ์…</p>
      </Centered>
    );
  }

  if (state.status === "empty") {
    return (
      <Centered>
        <p className="text-paper">ยังไม่มีผลการประเมิน</p>
        <ButtonLink href="/assessment" variant="primary" className="mt-4">
          เริ่ม Money Scan
        </ButtonLink>
      </Centered>
    );
  }

  if (state.status === "error") {
    return (
      <Centered>
        <p className="text-paper">เกิดข้อผิดพลาดในการคำนวณผล</p>
        <ButtonLink href="/assessment" variant="outline" className="mt-4">
          ทำแบบประเมินใหม่
        </ButtonLink>
      </Centered>
    );
  }

  const { snapshot } = state;
  const primary = MONEY_TYPES[snapshot.primaryType];
  const secondary = MONEY_TYPES[snapshot.secondaryType];
  const anti = MONEY_TYPES[snapshot.antiType];
  const topRoute = INCOME_ROUTES[snapshot.routeMatches[0].route];
  const topScore = snapshot.routeMatches[0].normalizedScore;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        {/* Hero */}
        <section>
          <Eyebrow>Money Type ของคุณคือ</Eyebrow>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-paper sm:text-5xl">
            {primary.name}
            <span className="text-red"> – </span>
            {secondary.name.replace("THE ", "")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            {primary.shortDescription}
          </p>
        </section>

        {/* Score cards */}
        <section className="mt-12">
          <Eyebrow>คะแนนสำคัญ</Eyebrow>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SCORE_CARDS.map((c) => (
              <Card key={c.key} className="p-5">
                <ScoreBar
                  label={c.label}
                  value={snapshot.dimensionScores[c.key]}
                />
              </Card>
            ))}
          </div>
        </section>

        {/* Insight */}
        <section className="mt-12">
          <Card className="p-6" glow="gold">
            <Eyebrow>Insight หลัก</Eyebrow>
            <p className="mt-3 text-lg leading-relaxed text-paper">
              จุดแข็งของคุณคือ{" "}
              <span className="text-gold">{primary.strengths[0]}</span> แต่จุดที่มัก
              ทำให้ไปไม่รอดคือ{" "}
              <span className="text-red-soft">{primary.weaknesses[0]}</span>{" "}
              ระบบแนะนำให้เริ่มจากเส้นทางที่ใช้จุดแข็งนี้ได้ทันที
            </p>
          </Card>
        </section>

        {/* Best route preview */}
        <section className="mt-12">
          <Eyebrow>เส้นทางที่เหมาะอันดับหนึ่ง</Eyebrow>
          <Card className="mt-5 p-6" glow="red">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-paper">
                {topRoute.name}
              </h2>
              <span className="font-mono text-xl font-bold text-gold">
                {topScore}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{topRoute.description}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {topRoute.whyItFits.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-paper">
                  <span className="mt-0.5 text-gold">◆</span>
                  {w}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Locked sections + CTA */}
        <section className="mt-12">
          <Eyebrow>ปลดล็อกใน Income Blueprint ฉบับเต็ม</Eyebrow>
          <div className="relative mt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {LOCKED_SECTIONS.map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-4 blur-[1.5px] select-none"
                >
                  <span className="text-muted">🔒</span>
                  <span className="text-sm text-muted">{s}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-gold/40 bg-ink/60 p-6 text-center">
              <SectionTitle className="mx-auto max-w-xl text-2xl sm:text-3xl">
                ปลดล็อก Income Blueprint ฉบับเต็ม
              </SectionTitle>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
                รับเส้นทางที่เหมาะ 3 อันดับ เส้นทางที่ควรหลีกเลี่ยง ข้อเสนอแรก
                แผนทดลอง 7 วัน และ Roadmap 30 วัน ที่ประกอบจากผลของคุณโดยเฉพาะ
              </p>
              <ButtonLink href="/pricing" variant="primary" size="lg" className="mt-6">
                ดูแพ็กเกจ
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* Anti-type note */}
        <p className="mt-10 text-center text-xs text-muted/70">
          ประเภทที่ฝืนธรรมชาติของคุณคือ {anti.name} — หลีกเลี่ยงการเริ่มจากเส้นทางที่
          ต้องพึ่งจุดนี้เป็นหลัก · ผลลัพธ์ช่วยตัดสินใจ ไม่ใช่การรับประกันรายได้
        </p>

        <div className="mt-6 text-center">
          <Link href="/assessment" className="text-sm text-muted hover:text-paper">
            ทำแบบประเมินใหม่
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
