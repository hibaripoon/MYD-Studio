# Media CRM & Work Management — Design Ideas

## ภาพรวมระบบ
ระบบสำหรับบริษัท Media ที่มี 2 ฝั่ง: AE (ผู้ดูแลงาน) และ Customer (ลูกค้า)
ต้องการความชัดเจน ใช้งานง่าย และดูเป็นมืออาชีพ

---

<response>
<probability>0.07</probability>
<idea>

**Design Movement:** Corporate Brutalism meets Digital Agency

**Core Principles:**
1. ความชัดเจนสูงสุด — ข้อมูลต้องอ่านได้ทันทีโดยไม่ต้องคิด
2. โครงสร้างแข็งแกร่ง — border หนา, grid ชัดเจน, ไม่มีความกำกวม
3. สีเป็น Signal — แต่ละ status มีสีที่จดจำได้ทันที
4. ลำดับชั้นชัดเจน — ข้อมูลสำคัญใหญ่กว่าเสมอ

**Color Philosophy:**
- Background: #0F0F0F (ดำเกือบสนิท)
- Surface: #1A1A1A
- Primary Accent: #F5C518 (เหลืองทอง — ความสำเร็จ, urgency)
- Success: #00C896
- Warning: #FF6B35
- Text: #FFFFFF / #AAAAAA

**Layout Paradigm:**
- Sidebar ซ้ายแคบ (icon-only) + content area เต็มหน้าจอ
- Header bar บาง แต่มี context breadcrumb ชัดเจน
- Card ใช้ border 1px solid แทน shadow
- Table-first สำหรับ list views

**Signature Elements:**
1. Status badge แบบ pill ที่มีสีสดมาก บน background มืด
2. Progress bar แบบ segmented (แต่ละ segment = milestone)
3. Typography: Space Grotesk Bold สำหรับ heading, JetBrains Mono สำหรับ numbers/codes

**Interaction Philosophy:**
- Hover: border color เปลี่ยนเป็น accent
- Click: instant feedback ไม่มี delay
- Modal: slide-in จากขวา ไม่ใช่ center popup

**Animation:**
- Transition: 150ms ease-out เท่านั้น
- ไม่มี bounce หรือ spring
- Number counter animation สำหรับ dashboard stats

**Typography System:**
- Display: Space Grotesk 700 (headings, stats)
- Body: Inter 400/500 (content)
- Code/Numbers: JetBrains Mono (IDs, amounts)

</idea>
</response>

<response>
<probability>0.08</probability>
<idea>

**Design Movement:** Modern SaaS — Clean Slate with Warm Accents

**Core Principles:**
1. Light & Airy — พื้นที่หายใจเยอะ, ไม่อึดอัด
2. Warm Neutrals — ไม่ใช่ cold gray แต่เป็น warm slate
3. Accent ที่ทรงพลัง — สีเดียวที่โดดเด่น ทำงานหนัก
4. Data-forward — ตัวเลขและ status เห็นก่อนเสมอ

**Color Philosophy:**
- Background: #FAFAF8 (warm white)
- Surface: #FFFFFF
- Sidebar: #1C2333 (deep navy)
- Primary: #3B5BDB (indigo — trust, professionalism)
- Success: #2F9E44
- Warning: #E67700
- Danger: #C92A2A
- Text: #1C2333 / #6B7280

**Layout Paradigm:**
- Sidebar ซ้าย fixed 240px (dark navy) + main content area
- Top bar บาง 56px สำหรับ context + actions
- Card-based layout สำหรับ dashboard
- Split-view สำหรับ Task Detail (list ซ้าย, detail ขวา)

**Signature Elements:**
1. Sidebar navigation ที่มี active state เป็น pill สีขาวบน navy
2. Stat card ที่มี colored left-border (4px) บอก category
3. Avatar + initials สำหรับ customer/AE identification

**Interaction Philosophy:**
- Hover: subtle background highlight
- Active: bold left border + color change
- Forms: inline validation, smooth error states

**Animation:**
- Page transition: fade 200ms
- Card entrance: stagger 50ms per item
- Modal: scale from 0.95 + fade

**Typography System:**
- Display: Plus Jakarta Sans 700/800
- Body: Plus Jakarta Sans 400/500
- Numbers: Tabular nums via font-variant-numeric

</idea>
</response>

<response>
<probability>0.06</probability>
<idea>

**Design Movement:** Editorial Dashboard — Magazine meets Enterprise Tool

**Core Principles:**
1. Typography เป็น Hero — ขนาดตัวอักษรต่างกันมาก สร้าง rhythm
2. Asymmetric Grid — ไม่ symmetric, ทำให้ดูมีชีวิตชีวา
3. Color Blocking — section ต่างๆ มี background ต่างกัน
4. Micro-detail obsession — ทุก pixel มีความหมาย

**Color Philosophy:**
- Background: #F4F1EC (warm cream)
- Dark Section: #1A1714
- Accent: #E85D04 (burnt orange — energy, action)
- Secondary: #023E8A (deep blue — trust)
- Text: #1A1714 / #6B5E4E

**Layout Paradigm:**
- Full-width header ที่ bold มาก
- Content area แบ่งเป็น columns ไม่เท่ากัน (60/40 หรือ 70/30)
- Dashboard stats แบบ large editorial numbers
- Table ที่มี alternating row colors แบบ newspaper

**Signature Elements:**
1. Large display numbers สำหรับ KPI (ขนาด 64px+)
2. Horizontal rule ที่มีสีแทน border ธรรมดา
3. Tag/badge แบบ uppercase letter-spaced

**Interaction Philosophy:**
- Hover: underline animation แบบ editorial
- Transition: เน้น content shift มากกว่า element animation
- Breadcrumb: เป็น visual journey

**Animation:**
- Number flip animation สำหรับ stats
- Slide-up entrance สำหรับ list items
- Color transition 300ms cubic-bezier

**Typography System:**
- Display: Syne 800 (dramatic headings)
- Body: DM Sans 400/500
- Accent: Syne 700 italic สำหรับ labels

</idea>
</response>

---

## Selected Approach: Modern SaaS — Clean Slate with Warm Accents

เลือก Approach ที่ 2 เพราะ:
- เหมาะกับ Internal Tool ที่ต้องใช้งานทุกวัน (ไม่เหนื่อยตา)
- Dark sidebar + light content = contrast ชัดเจน ง่ายต่อ navigation
- Plus Jakarta Sans ดูเป็นมืออาชีพและอ่านง่าย
- Color system ที่ชัดเจนสำหรับ status ต่างๆ
