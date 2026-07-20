import { ButtonLink } from "@/components/ui/button";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import Image from "next/image";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { MONEY_TYPE_LIST } from "@/lib/domain/money-types";
import { IDENTITY_LIST } from "@/lib/domain/identities";
import PersonaImage, {
  IdentityImage,
  TYPE_HALO,
} from "@/components/persona/persona-image";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Scan",
    thai: "สแกนตัวตน",
    desc: "ตอบคำถามเกี่ยวกับตัวตนและทรัพยากรของคุณ",
    image: "/steps/01-scan.webp",
    halo: "cyan" as const,
  },
  {
    step: "02",
    title: "Match",
    thai: "จับคู่เส้นทาง",
    desc: "ระบบจับคู่คุณกับเส้นทางรายได้ที่เหมาะสม",
    image: "/steps/02-match.webp",
    halo: "violet" as const,
  },
  {
    step: "03",
    title: "Blueprint",
    thai: "วางแผนแม่บท",
    desc: "รับแผนสร้างรายได้เฉพาะบุคคลฉบับเต็ม",
    image: "/steps/03-blueprint.webp",
    halo: "gold" as const,
  },
  {
    step: "04",
    title: "Experiment",
    thai: "ทดลองจริง",
    desc: "ทดลองตลาดก่อนเดิมพันใหญ่",
    image: "/steps/04-experiment.webp",
    halo: "red" as const,
  },
  {
    step: "05",
    title: "Review",
    thai: "วัดผลและปรับ",
    desc: "วัดผลและปรับเส้นทางอย่างเป็นระบบ",
    image: "/steps/05-review.webp",
    halo: "cyan" as const,
  },
];

const STEP_HALO: Record<string, string> = {
  gold: "bg-[radial-gradient(circle,rgba(255,197,49,0.45),transparent_68%)]",
  violet: "bg-[radial-gradient(circle,rgba(155,107,255,0.5),transparent_68%)]",
  cyan: "bg-[radial-gradient(circle,rgba(55,224,224,0.45),transparent_68%)]",
  red: "bg-[radial-gradient(circle,rgba(255,85,102,0.45),transparent_68%)]",
};

const RECEIVE = [
  "อัตลักษณ์ทางการเงินของคุณ (1 ใน 16 แบบ)",
  "เส้นทางที่เหมาะ 3 อันดับ พร้อมเหตุผล",
  "เส้นทางที่ควรหลีกเลี่ยงในตอนนี้",
  "ข้อเสนอแรกและแผนหาลูกค้า 20 คนแรก",
  "แผนทดลอง 7 วัน และ Roadmap 30 วัน",
  "เกณฑ์ตัดสินว่าไปต่อหรือหยุด",
];

const PRODUCTS = [
  {
    image: "/products/money-scan.png",
    name: "Money Scan",
    price: "ฟรี",
    desc: "แบบประเมิน 48 ข้อ + ผลลัพธ์อัตลักษณ์เบื้องต้น",
  },
  {
    image: "/products/income-blueprint.png",
    name: "Income Blueprint",
    price: "199฿",
    desc: "รายงานเส้นทางรายได้ฉบับเต็มเฉพาะบุคคล",
  },
  {
    image: "/products/route-kit.png",
    name: "Route Kit",
    price: "299฿",
    desc: "ชุดเครื่องมือลงมือ + โปรแกรม 45 วัน (แถม Blueprint)",
  },
];

const FAQ = [
  {
    q: "นี่คือแบบทดสอบดูดวงหรือเปล่า?",
    a: "ไม่ใช่ ระบบใช้การให้คะแนนแบบกฎที่ชัดเจนและตรวจสอบได้ ไม่ใช่การเดาหรือดวง คำตอบชุดเดิมจะได้ผลลัพธ์เดิมเสมอ",
  },
  {
    q: "การันตีรายได้ไหม?",
    a: "ไม่การันตี ระบบช่วยตัดสินใจว่าควรเริ่มจากเส้นทางใด ผลลัพธ์ขึ้นอยู่กับตลาด ทักษะ และการลงมือของคุณ",
  },
  {
    q: "ต้องมีเงินทุนหรือผู้ติดตามก่อนไหม?",
    a: "ไม่จำเป็น ระบบมีเส้นทางสำหรับคนทุนน้อยและไม่มีฐานผู้ติดตามด้วย โดยพิจารณาจากข้อจำกัดจริงของคุณ",
  },
  {
    q: "ใช้เวลานานแค่ไหน?",
    a: "แบบประเมินใช้เวลาประมาณ 5–8 นาที ตอบจากพฤติกรรมจริงของคุณ ไม่มีคำตอบถูกหรือผิด",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero — full-bleed cosmic banner with legibility scrims */}
        <section className="relative overflow-hidden border-b border-border/60">
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="/hero/hero-mobile-1080x1920.webp"
            />
            <source
              media="(max-width: 1024px)"
              srcSet="/hero/hero-tablet-1600x1200.webp"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero/hero-desktop-1920x1080.webp"
              alt="6 Money Types และ 16 อัตลักษณ์ Money Route"
              width={1920}
              height={1080}
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>
          {/* Scrims: darken top (behind header) + bottom (behind text) so art
              stays vivid in the middle and copy is always readable. */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-bg/70" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg via-bg/70 to-transparent" />

          <div className="relative mx-auto flex min-h-[82vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-24">
            <div className="max-w-2xl rmr-fade-up">
              <Eyebrow>ROOTMAN MONEY ROUTE</Eyebrow>
              <h1 className="text-3d mt-5 text-4xl font-black leading-[1.1] tracking-tight text-paper sm:text-6xl">
                คุณอาจไม่ได้หาเงินไม่เก่ง
                <br />
                <span className="text-gold">
                  แค่กำลังเล่นเกมที่ไม่เหมาะกับตัวเอง
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/85">
                ตอบคำถามเกี่ยวกับเงินทุน เวลา ทักษะ บุคลิก และข้อจำกัดของคุณ
                เพื่อค้นหาเส้นทางสร้างรายได้ที่มีความเหมาะสมมากกว่า
                พร้อมแผนเริ่มต้นที่ลงมือทำได้จริง
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink
                  href="/assessment"
                  variant="primary"
                  size="lg"
                  className="rmr-cta-pulse"
                >
                  เริ่มวิเคราะห์เส้นทางของฉัน
                </ButtonLink>
                <span className="text-sm text-muted">
                  ไม่มีคำตอบถูกหรือผิด · ใช้เวลา 5–8 นาที
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Hidden Problem */}
        <section className="border-y border-border/60 bg-ink/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionTitle>
              คนไม่ได้ขาดวิธีหาเงิน
              <br />
              <span className="text-tan">
                แต่ขาดวิธีเลือกว่าควรเริ่มจากอะไร
              </span>
            </SectionTitle>
            <p className="mt-6 max-w-2xl text-muted">
              ทุกวันคุณเห็นคนหาเงินจาก Affiliate, ฟรีแลนซ์, ขายของ, สร้างช่อง
              และเปิดแบรนด์ แต่สิ่งที่ทำให้คนหนึ่งสำเร็จ
              อาจทำให้อีกคนเสียเวลาเป็นปี เพราะแต่ละเส้นทางต้องการเงินทุน เวลา
              ทักษะ และนิสัยที่ต่างกัน
            </p>
          </div>
        </section>

        {/* How it works — illustrated 5 steps */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <Eyebrow>วิธีการทำงาน</Eyebrow>
            <SectionTitle className="mt-3">
              5 ขั้นตอน จากคำถามสู่แผนลงมือจริง
            </SectionTitle>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {HOW_IT_WORKS.map((s, i) => (
              <Card
                key={s.step}
                className="flex flex-col items-center p-5 text-center rmr-fade-up"
                glow="gold"
              >
                <div
                  className="rmr-fade-up flex flex-col items-center"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <div
                      aria-hidden
                      className={`persona-halo pointer-events-none absolute inset-2 ${STEP_HALO[s.halo]}`}
                    />
                    <Image
                      src={s.image}
                      alt={`${s.title} — ${s.thai}`}
                      width={256}
                      height={256}
                      className="rmr-bob relative z-10 h-28 w-28 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-110"
                      style={{ animationDelay: `${i * 0.6}s` }}
                    />
                    <span className="font-pixel absolute -right-1 -top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-gold text-xs font-black text-ink rmr-wiggle">
                      {s.step}
                    </span>
                  </div>
                  <div className="mt-3 text-lg font-bold text-paper">
                    {s.thai}
                  </div>
                  <div className="font-pixel mt-0.5 text-[10px] uppercase tracking-widest text-gold">
                    {s.title}
                  </div>
                  <p className="mt-2 text-sm text-muted">{s.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Money Types */}
        <section className="border-y border-border/60 bg-ink/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <Eyebrow>Money Types</Eyebrow>
            <SectionTitle className="mt-3">
              รูปแบบการทำเงินตามธรรมชาติ 6 แบบ
            </SectionTitle>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MONEY_TYPE_LIST.map((t) => (
                <Card key={t.slug} className="p-5" glow="gold">
                  <div className="flex items-start gap-4">
                    <PersonaImage
                      type={t.slug}
                      size="sm"
                      ground={false}
                      halo={TYPE_HALO[t.slug]}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xl font-extrabold tracking-tight text-paper">
                        {t.name}
                      </div>
                      <div className="mt-0.5 text-sm text-gold">
                        {t.tagline}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {t.shortDescription}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 16 Identities */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Eyebrow>16 อัตลักษณ์ทางการเงิน</Eyebrow>
          <SectionTitle className="mt-3">
            จาก 6 Money Types สู่ 16 อัตลักษณ์ที่เป็นตัวคุณ
          </SectionTitle>
          <p className="mt-4 max-w-2xl text-muted">
            หลังทำแบบทดสอบ ระบบจะบอกว่าคุณคือ 1 ใน 16 อัตลักษณ์ —
            ผสานจุดแข็งหลักและรองของคุณเข้าด้วยกัน พร้อมเส้นทางที่เหมาะ
            และคู่หูที่ควรจับมือเพื่อไปให้ไกลกว่าเดิม
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {IDENTITY_LIST.map((id) => (
              <Card key={id.slug} className="p-5" glow="gold">
                <div className="flex flex-col items-center text-center">
                  <IdentityImage
                    slug={id.slug}
                    baseType={id.baseType}
                    size="md"
                    zoom={1.2}
                    ground={false}
                    halo={TYPE_HALO[id.baseType]}
                  />
                  <div className="mt-3 font-pixel text-[11px] uppercase tracking-widest text-gold">
                    {id.name}
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-paper">
                    {id.thaiName}
                  </div>
                  <div className="mt-1 text-xs text-gold/80">{id.tagline}</div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/assessment" variant="primary" size="lg">
              ค้นหาอัตลักษณ์ของฉัน
            </ButtonLink>
          </div>
        </section>

        {/* What you receive */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <Eyebrow>สิ่งที่คุณจะได้รับ</Eyebrow>
              <SectionTitle className="mt-3">
                Income Blueprint เฉพาะบุคคล
              </SectionTitle>
              <p className="mt-4 text-muted">
                รายงานฉบับเต็มที่ประกอบขึ้นจากผลการประเมินของคุณ
                เพื่อให้เริ่มลงมือได้ทันทีโดยไม่ต้องเดา
              </p>
              <ButtonLink
                href="/assessment"
                variant="gold"
                size="md"
                className="mt-6"
              >
                เริ่ม Money Scan ฟรี
              </ButtonLink>
            </div>
            <ul className="grid gap-3">
              {RECEIVE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface/60 p-4"
                >
                  <span className="mt-0.5 text-gold">◆</span>
                  <span className="text-sm text-paper">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Products showcase */}
        <section className="border-y border-border/60 bg-ink/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="text-center">
              <Eyebrow>แพ็กเกจ</Eyebrow>
              <SectionTitle className="mt-3">
                เริ่มฟรี แล้วปลดล็อกเมื่อพร้อมลงมือจริง
              </SectionTitle>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.map((p, i) => (
                <Card
                  key={p.name}
                  className="flex flex-col p-6"
                  glow={i === 2 ? "gold" : null}
                >
                  <div className="flex items-center justify-center rounded-lg border border-border/60 bg-ink/50 p-3">
                    <Image
                      src={p.image}
                      alt={p.name}
                      width={480}
                      height={480}
                      className="h-44 w-auto object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)]"
                    />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <span className="text-lg font-extrabold text-paper">
                      {p.name}
                    </span>
                    <span className="font-pixel text-lg text-gold">
                      {p.price}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted">{p.desc}</p>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <ButtonLink href="/pricing" variant="gold" size="md">
                ดูรายละเอียดแพ็กเกจ
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/60 bg-ink/40">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <Eyebrow>คำถามที่พบบ่อย</Eyebrow>
            <div className="mt-8 space-y-4">
              {FAQ.map((f) => (
                <Card key={f.q} className="p-5">
                  <div className="font-semibold text-paper">{f.q}</div>
                  <p className="mt-2 text-sm text-muted">{f.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <SectionTitle className="mx-auto max-w-2xl">
            หยุดซื้อความรู้แบบสุ่ม
            <br />
            เริ่มจากการรู้ว่าคุณควรใช้ความรู้อะไร
          </SectionTitle>
          <div className="mt-8">
            <ButtonLink href="/assessment" variant="primary" size="lg">
              เริ่มวิเคราะห์เส้นทางของฉัน
            </ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
