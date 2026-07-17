import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import CheckoutButton from "@/components/payments/checkout-button";

export const metadata: Metadata = {
  title: "ราคา — ROOTMAN MONEY ROUTE",
};

const TIERS = [
  {
    name: "Money Scan",
    price: "ฟรี",
    desc: "แบบประเมินและผลลัพธ์เบื้องต้น",
    features: [
      "Money Type หลักและรอง",
      "คะแนนสำคัญ 6 ด้าน",
      "Insight หลัก",
      "เส้นทางอันดับหนึ่งแบบย่อ",
    ],
    cta: { label: "เริ่มเลย", href: "/assessment", variant: "gold" as const },
    highlight: false,
  },
  {
    name: "Income Blueprint",
    price: "390฿",
    priceNote: "ราคาช่วงเปิดตัว",
    desc: "รายงานฉบับเต็มเฉพาะบุคคล",
    features: [
      "เส้นทางที่เหมาะ 3 อันดับ",
      "เส้นทางที่ควรหลีกเลี่ยง",
      "ข้อเสนอแรก + แผนหาลูกค้า",
      "แผนทดลอง 7 วัน & Roadmap 30 วัน",
      "เกณฑ์ตัดสินไปต่อหรือหยุด",
    ],
    checkout: "income_blueprint" as const,
    cta: { label: "ปลดล็อกเลย", href: "/assessment", variant: "primary" as const },
    highlight: true,
  },
  {
    name: "Route Kit",
    price: "590฿",
    priceNote: "ราคาช่วงเปิดตัว",
    desc: "ชุดเครื่องมือปฏิบัติตามเส้นทาง",
    features: [
      "เทมเพลตข้อความพร้อมใช้",
      "เช็กลิสต์เครื่องมือ + จังหวะรายสัปดาห์",
      "แนวทางตั้งราคา",
      "ข้อผิดพลาดที่ต้องเลี่ยง",
    ],
    checkout: "route_kit" as const,
    cta: { label: "ปลดล็อก Route Kit", href: "/assessment", variant: "gold" as const },
    highlight: false,
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; canceled?: string }>;
}) {
  const { session, canceled } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <div className="text-center">
          <Eyebrow>ราคา</Eyebrow>
          <SectionTitle className="mt-3">
            เริ่มฟรี จ่ายเมื่อพร้อมลงมือจริง
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            ระบบช่วยตัดสินใจ ไม่ใช่การรับประกันรายได้
            ผลลัพธ์ขึ้นอยู่กับตลาด ทักษะ และการลงมือของคุณ
          </p>
          {canceled && (
            <p className="mx-auto mt-4 max-w-xl text-sm text-red-soft">
              ยกเลิกการชำระเงินแล้ว คุณสามารถกดปลดล็อกใหม่ได้ทุกเมื่อ
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <Card
              key={t.name}
              className="flex flex-col p-6"
              glow={t.highlight ? "red" : null}
            >
              <div className="text-lg font-bold text-paper">{t.name}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gold">{t.price}</span>
                {t.priceNote && (
                  <span className="text-xs text-muted">{t.priceNote}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">{t.desc}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-paper">
                    <span className="mt-0.5 text-gold">◆</span>
                    {f}
                  </li>
                ))}
              </ul>
              {"checkout" in t && t.checkout ? (
                <CheckoutButton
                  productSlug={t.checkout}
                  sessionId={session}
                  variant={t.cta.variant}
                  className="mt-6"
                >
                  {t.cta.label}
                </CheckoutButton>
              ) : (
                <ButtonLink
                  href={t.cta.href}
                  variant={t.cta.variant}
                  className="mt-6 w-full"
                >
                  {t.cta.label}
                </ButtonLink>
              )}
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted/70">
          ROOTMAN Money Lab (ระบบสมาชิก) กำลังเปิดรับ Waitlist เร็ว ๆ นี้
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
