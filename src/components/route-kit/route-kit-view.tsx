import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { ROUTE_KIT_CONTENT } from "@/lib/domain/route-kit-content";
import type { RouteKey } from "@/lib/domain/income-routes";

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-paper/80">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 text-gold">▸</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RouteKitView({
  routeKey,
  routeName,
}: {
  routeKey: RouteKey;
  routeName: string;
}) {
  const kit = ROUTE_KIT_CONTENT[routeKey];
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <Eyebrow>Route Kit</Eyebrow>
        <SectionTitle>{routeName}</SectionTitle>
        <p className="text-sm text-muted">
          ชุดเครื่องมือลงมือทำจริงสำหรับเส้นทางของคุณ — เทมเพลต ราคา จังหวะรายสัปดาห์ และข้อผิดพลาดที่ต้องเลี่ยง
        </p>
      </div>

      <section className="space-y-4">
        <SectionTitle className="text-2xl">เช็กลิสต์เครื่องมือ</SectionTitle>
        <Card className="p-6">
          <Bullets items={kit.toolChecklist} />
        </Card>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-2xl">เทมเพลตข้อความ</SectionTitle>
        <div className="space-y-3">
          {kit.messageTemplates.map((tpl, i) => (
            <Card key={i} className="space-y-2 p-6">
              <p className="font-semibold text-gold">{tpl.label}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-paper/80">
                {tpl.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-2xl">แนวทางตั้งราคา</SectionTitle>
        <Card glow="gold" className="p-6">
          <p className="text-sm leading-relaxed text-paper/90">
            {kit.pricingGuide}
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-2xl">จังหวะรายสัปดาห์</SectionTitle>
        <Card className="p-6">
          <Bullets items={kit.weeklyRhythm} />
        </Card>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-2xl">ข้อผิดพลาดที่ต้องเลี่ยง</SectionTitle>
        <Card glow="red" className="p-6">
          <Bullets items={kit.commonMistakes} />
        </Card>
      </section>
    </div>
  );
}
