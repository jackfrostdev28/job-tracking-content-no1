# Hugcode | ติดตามงานทีม

เว็บแอป Kanban ภาษาไทยสำหรับจัดการงานร่วมกัน รองรับมือถือ ใช้ HTML, CSS และ JavaScript แบบ static ไม่ต้อง build ก่อนเปิดหรือ deploy

## เปิดใช้งาน

เปิด `index.html` ในเบราว์เซอร์เพื่อทดลองโหมดในเครื่อง หรือรัน local web server จากโฟลเดอร์โปรเจกต์ เช่น `npx serve .` แล้วเปิด URL ที่แสดง แอปมีงานตัวอย่างให้ทดลองทันที และเก็บข้อมูลสำรองใน `localStorage` ของเบราว์เซอร์

หากต้องการซิงก์บอร์ดร่วมกัน ให้ตั้งค่า Supabase ตามหัวข้อถัดไป การใช้ localStorage เพียงอย่างเดียวเป็นข้อมูลเฉพาะเบราว์เซอร์/เครื่องนั้น

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ [Supabase](https://supabase.com/) และเปิด **Authentication → Providers → Email**
2. สร้างบัญชีสมาชิกทีมผ่าน **Authentication → Users → Add user** (แอปนี้ใช้ email/password sign-in และไม่เปิดสมัครสมาชิกจากหน้าเว็บ)
3. เปิด **SQL Editor** แล้วรันเนื้อหาใน [`supabase-schema.sql`](supabase-schema.sql) ตาราง `workboard_state` มี RLS และ policy ให้เฉพาะผู้ใช้ที่ยืนยันตัวตนอ่าน/เขียนบอร์ดส่วนกลางได้
4. เปิด [`supabase-config.js`](supabase-config.js) แล้วกรอก Project URL และ **publishable key** หรือ legacy **anon key** จาก Project Settings → API Keys:

   ```js
   window.HUGCODE_SUPABASE_CONFIG = {
     url: "https://YOUR_PROJECT.supabase.co",
     anonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY"
   };
   ```

   ใช้เฉพาะ key สำหรับ client เท่านั้น ห้ามใส่ `service_role` หรือ secret key ในเว็บแอป
5. เปิดหน้าเว็บ ลงชื่อเข้าใช้ด้วยบัญชีที่สร้างไว้ บอร์ดจะแชร์แถว `id = 'shared'` ให้ผู้ใช้ที่ authenticated ในโปรเจกต์เดียวกัน
6. ตรวจสอบว่า `workboard_state` อยู่ใน publication `supabase_realtime` (SQL ด้านบนพยายามเพิ่มตารางให้แล้ว) เพื่อรับการเปลี่ยนแปลงแบบเรียลไทม์

หากยังไม่ได้กรอก config แอปจะเปิดหน้าคำแนะนำและยังเข้าโหมดทำงานในเครื่องได้ เมื่อ Supabase ใช้งานไม่ได้ ข้อมูล localStorage จะยังอยู่และมีสถานะซิงก์แจ้งบนหน้า

> บอร์ดนี้เป็นพื้นที่ร่วมของผู้ใช้ที่ล็อกอินใน Supabase project เดียวกัน การควบคุมสิทธิ์ระดับทีม/องค์กรแยกกันต้องเพิ่ม `workspace_id` และ policy ตามสมาชิก workspace ก่อนใช้งานกับหลายทีม

## Deploy บน Vercel

1. push โฟลเดอร์นี้ขึ้น GitHub หรือใช้ Vercel CLI (`npx vercel`)
2. Import repository เข้า Vercel; ใช้ **Other**/static site framework preset, ไม่ต้องตั้ง build command และตั้ง output directory เป็น `.`
3. deploy ได้เลย เพราะ `index.html`, `styles.css`, `app.js` และ `supabase-config.js` อยู่ที่ root
4. ตั้งค่า Supabase URL allow list ให้รวม domain ที่ deploy และ localhost ที่ใช้พัฒนา (Authentication → URL Configuration)

อย่า commit config ที่มีข้อมูลลับ แม้ Supabase publishable/anon key จะใช้บน client ได้ ควรใช้ RLS ตาม schema เสมอ

## ฟีเจอร์

- 4 สถานะ Kanban; จัดเป็น 4 คอลัมน์บนจอกว้าง, 2 คอลัมน์บนแท็บเล็ต และ 1 คอลัมน์บนมือถือ
- เพิ่ม/แก้ไข/ลบงาน, ย้ายสถานะด้วย drag-and-drop หรือเมนู, เปิดรายละเอียดและเพิ่มความคิดเห็น
- ค้นหาและกรองผู้รับผิดชอบ/วันที่มอบหมาย/กำหนดส่ง พร้อมล้างตัวกรอง
- ส่งออกข้อมูลที่ผ่านตัวกรองเป็น CSV แบบ UTF-8 BOM ซึ่งเปิดด้วย Excel ได้
- จัดการรายการผู้รับผิดชอบ ผู้มอบหมาย โมดูล และชื่อสถานะ
- Supabase Auth, PostgreSQL JSONB state, RLS, Realtime และ localStorage fallback

## ข้อจำกัด

- Export เป็น CSV ที่เปิดด้วย Excel ได้ ไม่ใช่ไฟล์ XLSX native
- การยืนยันตัวตนและ realtime ต้องตั้งค่า Supabase ก่อน; โหมด local ไม่มีการ sync ระหว่างเครื่อง
- Realtime ใช้ snapshot JSONB แถวเดียวและ last-write-wins จึงเหมาะกับบอร์ดทีมขนาดเล็ก หากมีหลายคนแก้พร้อมกันอาจมีการทับการเปลี่ยนแปลง ควรแยกตาราง/เพิ่ม conflict resolution สำหรับงานระดับ production ที่มีการแก้พร้อมกันสูง
- ฟอนต์โหลดจาก Google Fonts; หากออฟไลน์จะใช้ system fallback
