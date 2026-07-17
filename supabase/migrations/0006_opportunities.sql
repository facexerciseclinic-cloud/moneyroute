-- ROOTMAN MONEY ROUTE — Migration 0006: opportunities (Opportunity Radar)
-- Admin-curated income opportunities shown on the public radar.
-- Apply via `node scripts/db-migrate.mjs`.

create table if not exists public.opportunities (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  title                 text not null,
  summary               text not null,
  payer                 text not null,
  pain_point            text not null,
  revenue_model         text not null,
  capital_score         integer not null default 3 check (capital_score between 1 and 5),
  speed_score           integer not null default 3 check (speed_score between 1 and 5),
  difficulty_score      integer not null default 3 check (difficulty_score between 1 and 5),
  scale_score           integer not null default 3 check (scale_score between 1 and 5),
  platform_risk_score   integer not null default 3 check (platform_risk_score between 1 and 5),
  visibility_requirement text not null default 'low'
                          check (visibility_requirement in ('low', 'medium', 'high')),
  sales_requirement     text not null default 'low'
                          check (sales_requirement in ('low', 'medium', 'high')),
  recommended_types     jsonb not null default '[]'::jsonb,
  recommended_routes    jsonb not null default '[]'::jsonb,
  test_plan             jsonb not null default '[]'::jsonb,
  status                text not null default 'published'
                          check (status in ('draft', 'published', 'archived')),
  sort_order            integer not null default 0,
  published_at          timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_opportunities_status
  on public.opportunities (status, sort_order);

alter table public.opportunities enable row level security;

create policy "opportunities_select_published"
  on public.opportunities for select
  using (status = 'published');

-- ─────────────────────────────────────────────────────────────
-- Seed opportunities
-- ─────────────────────────────────────────────────────────────
insert into public.opportunities
  (slug, title, summary, payer, pain_point, revenue_model,
   capital_score, speed_score, difficulty_score, scale_score, platform_risk_score,
   visibility_requirement, sales_requirement, recommended_types, recommended_routes,
   test_plan, sort_order)
values
  (
    'local-biz-lead-gen',
    'หาลูกค้าให้ธุรกิจท้องถิ่นแบบรับส่วนแบ่ง',
    'ร้าน/ธุรกิจท้องถิ่นจำนวนมากมีสินค้าดีแต่ไม่มีเวลาหาลูกค้า รับปิดดีลแลกส่วนแบ่ง',
    'เจ้าของธุรกิจท้องถิ่น',
    'มีของดีแต่ยอดขายไม่โต ไม่มีเวลาการตลาด',
    'ส่วนแบ่งต่อดีล / ค่าคอมมิชชัน',
    1, 5, 2, 3, 2, 'low', 'high',
    '["hunter", "operator"]'::jsonb,
    '["commission", "local_business"]'::jsonb,
    '["เลือก 1 ธุรกิจในย่านคุณ", "เสนอช่วยหาลูกค้า 1 สัปดาห์แบบไม่ปิดไม่คิดเงิน", "วัดจำนวนดีลที่ปิดได้"]'::jsonb,
    10
  ),
  (
    'faceless-niche-content',
    'คอนเทนต์ไม่ออกหน้าในนิชเฉพาะ',
    'สร้างช่องคอนเทนต์สั้นแบบไม่ต้องออกหน้า เจาะนิชที่คนสนใจแต่คอนเทนต์ยังน้อย',
    'แบรนด์/แพลตฟอร์มโฆษณา/แอฟฟิลิเอต',
    'อยากมีรายได้จากคอนเทนต์แต่ไม่อยากออกหน้า',
    'แอฟฟิลิเอต / รับรีวิว / โฆษณา',
    1, 2, 3, 5, 4, 'low', 'low',
    '["creator", "builder"]'::jsonb,
    '["faceless_content", "digital_asset"]'::jsonb,
    '["เลือกนิช 1 อัน", "ลงคลิปสั้น 7 วันติด", "ดูฮุกไหนได้ยอดวิวดีที่สุด"]'::jsonb,
    20
  ),
  (
    'productized-design',
    'บริการออกแบบแบบแพ็กเกจตายตัว',
    'ขายบริการออกแบบ (โลโก้/แบนเนอร์/สไลด์) เป็นแพ็กเกจราคาชัดเจน ส่งไว',
    'เจ้าของธุรกิจ/ครีเอเตอร์',
    'อยากได้งานออกแบบเร็ว ราคาชัด ไม่ต้องต่อรอง',
    'แพ็กเกจราคาคงที่ต่อชิ้น',
    2, 4, 2, 3, 2, 'low', 'medium',
    '["expert", "operator"]'::jsonb,
    '["productized_service", "digital_service"]'::jsonb,
    '["ทำพอร์ต 3 ชิ้น", "ตั้งราคาแพ็กเกจ", "เสนอขายผู้สนใจ 10 ราย"]'::jsonb,
    30
  ),
  (
    'digital-template-store',
    'ขายเทมเพลตดิจิทัลใช้ซ้ำได้',
    'ทำเทมเพลต (Notion/สไลด์/สเปรดชีต) ขายซ้ำได้ไม่จำกัด ต้นทุนเวลาครั้งเดียว',
    'คนทำงาน/นักเรียน/ธุรกิจเล็ก',
    'อยากได้เครื่องมือพร้อมใช้ ประหยัดเวลา',
    'ขายต่อชิ้น / bundle',
    1, 3, 3, 5, 3, 'low', 'low',
    '["creator", "builder", "expert"]'::jsonb,
    '["digital_asset", "productized_service"]'::jsonb,
    '["ทำเทมเพลต 1 ชิ้น", "ตั้งหน้าขาย + พรีวิว", "โปรโมต 7 วันแล้ววัดยอด"]'::jsonb,
    40
  ),
  (
    'niche-agency-retainer',
    'เอเจนซีเฉพาะทางแบบรายเดือน',
    'รับดูแลงานการตลาด/คอนเทนต์ให้ธุรกิจเฉพาะกลุ่มแบบ retainer รายเดือน',
    'ธุรกิจ SME ในนิชเดียว',
    'ไม่มีทีมภายใน อยากมีคนดูแลต่อเนื่อง',
    'ค่ารายเดือน (retainer)',
    2, 2, 4, 4, 2, 'medium', 'high',
    '["operator", "expert", "builder"]'::jsonb,
    '["agency", "digital_service"]'::jsonb,
    '["เลือกนิช 1 อัน + ทำเคสตัวอย่าง", "เสนอ 5 ธุรกิจ", "ปิดลูกค้า retainer รายแรก"]'::jsonb,
    50
  ),
  (
    'micro-saas-tool',
    'เครื่องมือ Micro-SaaS แก้ปัญหาเฉพาะ',
    'สร้างเครื่องมือเล็ก ๆ แก้ปัญหาเฉพาะกลุ่ม เก็บค่าบริการรายเดือน',
    'กลุ่มผู้ใช้เฉพาะทาง',
    'มีปัญหาซ้ำ ๆ ที่ยังไม่มีเครื่องมือตอบโจทย์',
    'subscription รายเดือน',
    3, 1, 5, 5, 2, 'low', 'medium',
    '["builder", "expert"]'::jsonb,
    '["software", "digital_asset"]'::jsonb,
    '["คุยกับผู้ใช้ 10 คน", "ทำ MVP แก้ปัญหาเดียว", "หาผู้ใช้จ่ายเงินรายแรก"]'::jsonb,
    60
  )
on conflict (slug) do nothing;
