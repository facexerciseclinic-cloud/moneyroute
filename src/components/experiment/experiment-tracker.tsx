"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExperimentTask } from "@/lib/domain/report-content";

type ExperimentState = {
  id: string;
  sessionId: string;
  status: "active" | "completed" | "abandoned";
  currentDay: number;
  completedDays: number[];
};

export default function ExperimentTracker({
  sessionId,
  routeName,
  tasks,
  initial,
}: {
  sessionId: string;
  routeName: string;
  tasks: ExperimentTask[];
  initial: ExperimentState | null;
}) {
  const router = useRouter();
  const [experiment, setExperiment] = useState<ExperimentState | null>(initial);
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const completed = new Set(experiment?.completedDays ?? []);
  const progress = experiment
    ? Math.round((completed.size / tasks.length) * 100)
    : 0;

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "request_failed");
    }
    const data = (await res.json()) as { experiment: ExperimentState };
    return data.experiment;
  }

  async function handleStart() {
    setStarting(true);
    setError("");
    try {
      const next = await post({ action: "start", sessionId });
      setExperiment(next);
      router.refresh();
    } catch {
      setError("เริ่มการทดลองไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setStarting(false);
    }
  }

  async function handleComplete(day: number) {
    setBusyDay(day);
    setError("");
    try {
      const next = await post({ action: "complete_day", sessionId, day });
      setExperiment(next);
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBusyDay(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Eyebrow>แผนทดลอง 7 วัน</Eyebrow>
        <SectionTitle>{routeName}</SectionTitle>
        <p className="text-sm text-muted">
          ลงมือทำวันละก้าว เป้าหมายคือได้ทำ Market Action จริงภายใน 7 วัน
        </p>
      </div>

      {experiment ? (
        <Card glow="gold" className="space-y-3 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-paper">
              ความคืบหน้า {completed.size}/{tasks.length} วัน
            </span>
            <span className="font-mono text-gold">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/60">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {experiment.status === "completed" && (
            <p className="text-sm text-gold">
              🎉 คุณทำครบ 7 วันแล้ว! ทบทวนผลและเริ่มรอบถัดไปเพื่อต่อยอด
            </p>
          )}
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-paper/80">
            เริ่มการทดลองเพื่อเปิดใช้การติดตามความคืบหน้ารายวัน
          </p>
          <Button
            variant="gold"
            onClick={handleStart}
            disabled={starting}
            className="shrink-0"
          >
            {starting ? "กำลังเริ่ม…" : "เริ่มการทดลอง 7 วัน"}
          </Button>
        </Card>
      )}

      {error && <p className="text-sm text-red-soft">{error}</p>}

      <ol className="space-y-3">
        {tasks.map((task) => {
          const done = completed.has(task.day);
          const isNext =
            experiment && !done && task.day === experiment.currentDay;
          return (
            <li key={task.day}>
              <Card
                className={`flex items-start gap-4 p-5 ${
                  done ? "opacity-70" : ""
                } ${isNext ? "border-gold/60" : ""}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    done
                      ? "bg-gold text-ink"
                      : "border border-border text-muted"
                  }`}
                >
                  {done ? "✓" : task.day}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-paper">
                    วันที่ {task.day}: {task.title}
                  </p>
                  <p className="text-sm leading-relaxed text-paper/70">
                    {task.instructions}
                  </p>
                </div>
                {experiment && !done && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleComplete(task.day)}
                    disabled={busyDay === task.day}
                    className="shrink-0"
                  >
                    {busyDay === task.day ? "…" : "ทำเสร็จแล้ว"}
                  </Button>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
