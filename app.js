(() => {
  "use strict";
  const STATUS = [
    { id: "todo", label: "รอดำเนินการ" },
    { id: "in_progress", label: "กำลังดำเนินการ" },
    { id: "review", label: "รอตรวจสอบ" },
    { id: "done", label: "เสร็จแล้ว" }
  ];
  const DEFAULTS = {
    assignees: ["ณัฐชา วัฒนกุล", "ธีรภัทร์ ใจดี", "มินตรา พรหมมา", "ปกรณ์ แซ่ลิ้ม"],
    creators: ["ศิริพร แก้วใส", "ณัฐชา วัฒนกุล", "วรินทร์ พัฒนกิจ"],
    modules: ["Dashboard", "Mobile App", "API & Backend", "Design System", "Landing Page"],
    statuses: STATUS.map(x => ({ ...x }))
  };
  const SAMPLE_TASKS = [
    { id: "sample-1", title: "ออกแบบหน้า Dashboard ภาพรวม", module: "Dashboard", description: "ออกแบบเลย์เอาต์และส่วนแสดงสถิติสำคัญให้ทีมดูความคืบหน้าได้ในมุมเดียว", tags: ["UI/UX", "Design"], assignee: "ณัฐชา วัฒนกุล", creator: "ศิริพร แก้วใส", priority: "high", assignedAt: "2026-10-01T09:00", dueAt: "2026-10-07T17:00", status: "in_progress", comments: [{ id: "c1", author: "ศิริพร แก้วใส", text: "ฝากเพิ่มส่วนสรุป KPI ไว้ด้านบนด้วยนะคะ", createdAt: "2026-10-02T10:30:00.000Z" }] },
    { id: "sample-2", title: "ปรับปรุงระบบแจ้งเตือนแบบ Push", module: "Mobile App", description: "เพิ่มการแจ้งเตือนเมื่อมีการอัปเดตสถานะงาน และตรวจสอบสิทธิ์การแจ้งเตือนบน iOS กับ Android", tags: ["Mobile", "Notification"], assignee: "ธีรภัทร์ ใจดี", creator: "วรินทร์ พัฒนกิจ", priority: "medium", assignedAt: "2026-10-02T13:00", dueAt: "2026-10-09T18:00", status: "todo", comments: [] },
    { id: "sample-3", title: "เชื่อมต่อ API สำหรับหน้าโปรไฟล์", module: "API & Backend", description: "ดึงข้อมูลโปรไฟล์และจัดการสถานะ loading, empty state และ error ให้ครบถ้วน", tags: ["API", "Backend"], assignee: "มินตรา พรหมมา", creator: "ศิริพร แก้วใส", priority: "high", assignedAt: "2026-09-30T10:00", dueAt: "2026-10-06T17:30", status: "in_progress", comments: [{ id: "c2", author: "วรินทร์ พัฒนกิจ", text: "API endpoint พร้อมทดสอบแล้วครับ", createdAt: "2026-10-03T04:00:00.000Z" }, { id: "c3", author: "มินตรา พรหมมา", text: "รับทราบ กำลังเชื่อมต่อค่ะ", createdAt: "2026-10-03T06:15:00.000Z" }] },
    { id: "sample-4", title: "ตรวจสอบ UI บนหน้าจอมือถือ", module: "Design System", description: "ทบทวนการแสดงผลและระยะห่างของคอมโพเนนต์บนหน้าจอขนาดเล็ก", tags: ["Responsive", "QA"], assignee: "ปกรณ์ แซ่ลิ้ม", creator: "ณัฐชา วัฒนกุล", priority: "low", assignedAt: "2026-10-03T14:00", dueAt: "2026-10-08T16:00", status: "review", comments: [] },
    { id: "sample-5", title: "จัดทำคู่มือเริ่มต้นสำหรับสมาชิกใหม่", module: "Landing Page", description: "สรุปขั้นตอนเข้าใช้งาน workspace พร้อมภาพประกอบและลิงก์แหล่งข้อมูล", tags: ["Documentation"], assignee: "ธีรภัทร์ ใจดี", creator: "วรินทร์ พัฒนกิจ", priority: "low", assignedAt: "2026-09-25T09:30", dueAt: "2026-10-04T18:00", status: "done", comments: [{ id: "c4", author: "ศิริพร แก้วใส", text: "ตรวจทานและเผยแพร่เรียบร้อยแล้วค่ะ", createdAt: "2026-10-04T09:30:00.000Z" }] },
    { id: "sample-6", title: "สรุป feedback จากผู้ใช้งานรอบล่าสุด", module: "Dashboard", description: "รวบรวมข้อเสนอแนะจากทีม support เพื่อจัดลำดับงานในรอบถัดไป", tags: ["Research", "Sprint 12"], assignee: "ณัฐชา วัฒนกุล", creator: "ศิริพร แก้วใส", priority: "medium", assignedAt: "2026-10-02T09:30", dueAt: "2026-10-10T12:00", status: "todo", comments: [] }
  ];
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOCAL_KEY = "hugcode-workboard-v1";
  let state = null, supabase = null, session = null, realtime = null, activeDetailId = null;
  let pendingRemote = false, saveTimer = null;
  let localMode = false;

  function defaultState() { return { version: 1, tasks: structuredClone(SAMPLE_TASKS), options: structuredClone(DEFAULTS), updatedAt: new Date().toISOString() }; }
  function normalizeState(value) {
    const base = defaultState();
    if (!value || typeof value !== "object") return base;
    const options = value.options || {};
    return {
      version: 1,
      tasks: Array.isArray(value.tasks) ? value.tasks.map(t => ({ ...t, id: String(t.id || crypto.randomUUID()), comments: Array.isArray(t.comments) ? t.comments : [], tags: Array.isArray(t.tags) ? t.tags : [], status: STATUS.some(s => s.id === t.status) ? t.status : "todo", priority: ["low", "medium", "high"].includes(t.priority) ? t.priority : "medium" })) : base.tasks,
      options: { assignees: Array.isArray(options.assignees) ? options.assignees : base.options.assignees, creators: Array.isArray(options.creators) ? options.creators : base.options.creators, modules: Array.isArray(options.modules) ? options.modules : base.options.modules, statuses: Array.isArray(options.statuses) ? options.statuses : base.options.statuses },
      updatedAt: value.updatedAt || new Date().toISOString()
    };
  }
  function loadLocal() { try { const raw = localStorage.getItem(LOCAL_KEY); return raw ? normalizeState(JSON.parse(raw)) : defaultState(); } catch { return defaultState(); } }
  function hasConfig() { const c = window.HUGCODE_SUPABASE_CONFIG || {}; return Boolean(c.url && c.anonKey && window.supabase?.createClient); }
  function toast(message, type = "") { const el = document.createElement("div"); el.className = `toast ${type}`; el.textContent = message; $("toasts").append(el); setTimeout(() => el.remove(), 3300); }
  function dateLabel(value, includeTime = false) { if (!value) return "ไม่ระบุ"; const d = new Date(value); if (Number.isNaN(d.getTime())) return "ไม่ระบุ"; return new Intl.DateTimeFormat("th-TH", includeTime ? { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }).format(d); }
  function toLocalInput(value) { if (!value) return ""; const d = new Date(value); if (Number.isNaN(d.getTime())) return ""; return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  function toIso(value) { return value ? new Date(value).toISOString() : ""; }
  function optsHtml(values, selected = "", placeholder = "เลือก") { return `<option value="">${esc(placeholder)}</option>${values.map(x => { const value = typeof x === "string" ? x : x.id; const label = typeof x === "string" ? x : x.label; return `<option value="${esc(value)}" ${selected === value ? "selected" : ""}>${esc(label)}</option>`; }).join("")}`; }
  function updateConnection(text, online) { $("connectionText").textContent = text; $("connection").classList.toggle("offline", !online); }
  function populateFilters() {
    const old = $("assigneeFilter").value;
    $("assigneeFilter").innerHTML = `<option value="">ผู้รับผิดชอบทั้งหมด</option>${state.options.assignees.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("")}`;
    $("assigneeFilter").value = state.options.assignees.includes(old) ? old : "";
  }
  function getVisibleTasks() {
    const q = $("searchInput").value.trim().toLocaleLowerCase("th");
    const assignee = $("assigneeFilter").value, dateType = $("dateFilter").value, date = $("filterDate").value;
    return state.tasks.filter(task => {
      const text = [task.title, task.module, task.description, task.assignee, task.creator, ...(task.tags || [])].join(" ").toLocaleLowerCase("th");
      if (q && !text.includes(q)) return false;
      if (assignee && task.assignee !== assignee) return false;
      if (dateType && date) { const candidate = dateType === "assigned" ? task.assignedAt : task.dueAt; if (!candidate || String(candidate).slice(0, 10) !== date) return false; }
      return true;
    });
  }
  function statusLabel(id) { return state.options.statuses.find(s => s.id === id)?.label || STATUS.find(s => s.id === id)?.label || "รอดำเนินการ"; }
  function render() {
    $("board").hidden = !localMode && hasConfig() && !session;
    $("boardLocked").hidden = localMode || !hasConfig() || Boolean(session);
    populateFilters();
    $("totalCount").innerHTML = `${state.tasks.length} <small>งาน</small>`;
    $("activeCount").innerHTML = `${state.tasks.filter(t => t.status === "in_progress").length} <small>งาน</small>`;
    const tasks = getVisibleTasks();
    $("board").innerHTML = STATUS.map(status => {
      const items = tasks.filter(t => t.status === status.id);
      return `<section class="column" data-status="${status.id}" aria-label="${esc(statusLabel(status.id))}" tabindex="0"><header class="column-head"><div class="column-title"><i class="column-dot"></i>${esc(statusLabel(status.id))}</div><span class="count-badge">${items.length}</span></header><div class="column-cards" data-drop="${status.id}">${items.length ? items.map(cardHtml).join("") : `<div class="empty-column">${getVisibleTasks().length ? "ไม่มีงานในสถานะนี้" : "ไม่พบงานที่ตรงกับตัวกรอง"}</div>`}</div></section>`;
    }).join("");
    $("lastSynced").textContent = `ซิงก์ล่าสุด ${dateLabel(state.updatedAt, true)}`;
    bindCards();
  }
  function cardHtml(task) {
    const priority = { low: "ต่ำ", medium: "ปานกลาง", high: "สูง" }[task.priority] || "ปานกลาง";
    const overdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== "done";
    const menuOptions = state.options.statuses.filter(s => s.id !== task.status).map(s => `<button data-action="move" data-id="${esc(task.id)}" data-status="${esc(s.id)}">ย้ายไป${esc(s.label)}</button>`).join("");
    return `<article class="task-card" draggable="true" tabindex="0" data-task="${esc(task.id)}" aria-label="${esc(task.title)} เปิดรายละเอียด"><div class="card-top"><span class="module-label">${esc(task.module || "ไม่ระบุโมดูล")}</span><div class="menu-wrap"><button class="icon-button menu-trigger" aria-label="เมนู ${esc(task.title)}" aria-haspopup="true" data-action="menu" data-id="${esc(task.id)}">···</button><div class="card-menu" hidden>${menuOptions}<button data-action="edit" data-id="${esc(task.id)}">แก้ไขงาน</button><button class="danger" data-action="delete" data-id="${esc(task.id)}">ลบงาน</button></div></div></div><h3 class="task-title">${esc(task.title)}</h3>${task.description ? `<p class="task-description">${esc(task.description)}</p>` : ""}<div class="tag-list">${(task.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}<span class="priority ${task.priority}">${priority}</span></div><div class="card-due ${overdue ? "overdue" : ""}"><span>◷</span> กำหนดส่ง ${esc(dateLabel(task.dueAt))}</div><footer class="card-footer"><span class="assignee"><i class="mini-avatar">${esc((task.assignee || "?").trim().charAt(0))}</i>${esc(task.assignee || "ยังไม่มอบหมาย")}</span><span class="comment-count" title="ความคิดเห็น">▤ ${(task.comments || []).length}</span></footer></article>`;
  }
  function bindCards() {
    document.querySelectorAll(".task-card").forEach(card => {
      card.addEventListener("click", e => { if (e.target.closest("button")) return; openDetail(card.dataset.task); });
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(card.dataset.task); } });
      card.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", card.dataset.task); e.dataTransfer.effectAllowed = "move"; card.classList.add("dragging"); });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
    });
    document.querySelectorAll(".column").forEach(col => {
      col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drag-over"); });
      col.addEventListener("dragleave", e => { if (!col.contains(e.relatedTarget)) col.classList.remove("drag-over"); });
      col.addEventListener("drop", e => { e.preventDefault(); col.classList.remove("drag-over"); moveTask(e.dataTransfer.getData("text/plain"), col.dataset.status); });
    });
    document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", e => { e.stopPropagation(); const { action, id, status } = button.dataset; if (action === "menu") { const menu = button.nextElementSibling; document.querySelectorAll(".card-menu").forEach(m => { if (m !== menu) m.hidden = true; }); menu.hidden = !menu.hidden; } else if (action === "move") moveTask(id, status); else if (action === "edit") { document.querySelectorAll(".card-menu").forEach(m => m.hidden = true); openTaskForm(id); } else if (action === "delete") { document.querySelectorAll(".card-menu").forEach(m => m.hidden = true); deleteTask(id); } }));
  }
  function taskById(id) { return state.tasks.find(t => t.id === id); }
  function commit() { state.updatedAt = new Date().toISOString(); try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch { toast("บันทึกสำรองในเครื่องไม่สำเร็จ", "error"); } render(); scheduleRemoteSave(); }
  function scheduleRemoteSave() { if (!supabase || !session) return; clearTimeout(saveTimer); saveTimer = setTimeout(saveRemote, 350); }
  async function saveRemote() {
    if (!supabase || !session) return;
    const { error } = await supabase.from("workboard_state").upsert({ id: "shared", payload: state, updated_at: state.updatedAt, updated_by: session.user.id }, { onConflict: "id" });
    if (error) { console.warn("Supabase save failed", error); updateConnection("บันทึกในเครื่อง · ซิงก์ไม่สำเร็จ", false); toast("ซิงก์ Supabase ไม่สำเร็จ ข้อมูลยังอยู่ในเครื่อง", "error"); }
    else { updateConnection("เชื่อมต่อแล้ว", true); $("lastSynced").textContent = `ซิงก์ล่าสุด ${dateLabel(new Date().toISOString(), true)}`; }
  }
  function moveTask(id, status) { const task = taskById(id); if (!task || !STATUS.some(s => s.id === status) || task.status === status) return; task.status = status; commit(); toast(`ย้ายงานไป${statusLabel(status)}แล้ว`); }
  function deleteTask(id) { const task = taskById(id); if (!task) return; if (!confirm(`ต้องการลบงาน “${task.title}” หรือไม่?`)) return; state.tasks = state.tasks.filter(t => t.id !== id); commit(); toast("ลบงานแล้ว"); }
  function openTaskForm(id = "") {
    const task = id ? taskById(id) : null;
    $("taskForm").reset(); $("taskError").textContent = "";
    $("taskDialogTitle").textContent = task ? "แก้ไขงาน" : "เพิ่มงานใหม่";
    $("taskId").value = task?.id || "";
    $("taskModule").value = task?.module || ""; $("taskTitle").value = task?.title || ""; $("taskDescription").value = task?.description || "";
    $("taskStatus").innerHTML = state.options.statuses.map(s => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join(""); $("taskStatus").value = task?.status || "todo";
    $("taskAssignee").innerHTML = optsHtml(state.options.assignees, task?.assignee, "ยังไม่ระบุ");
    $("taskCreator").innerHTML = optsHtml(state.options.creators, task?.creator, "ยังไม่ระบุ");
    $("taskPriority").value = task?.priority || "medium"; $("taskDue").value = toLocalInput(task?.dueAt); $("taskAssigned").value = toLocalInput(task?.assignedAt || new Date().toISOString());
    $("taskTags").value = (task?.tags || []).join(", ");
    $("moduleOptions").innerHTML = state.options.modules.map(x => `<option value="${esc(x)}"></option>`).join("");
    $("taskDialog").showModal(); setTimeout(() => $("taskTitle").focus(), 20);
  }
  $("taskForm").addEventListener("submit", e => {
    e.preventDefault(); const id = $("taskId").value;
    const payload = { title: $("taskTitle").value.trim(), module: $("taskModule").value.trim(), description: $("taskDescription").value.trim(), status: $("taskStatus").value, assignee: $("taskAssignee").value, creator: $("taskCreator").value, priority: $("taskPriority").value, dueAt: toIso($("taskDue").value), assignedAt: toIso($("taskAssigned").value), tags: $("taskTags").value.split(",").map(x => x.trim()).filter(Boolean) };
    if (!payload.title) { $("taskError").textContent = "กรุณาระบุชื่องาน"; return; }
    if (id) Object.assign(taskById(id), payload); else state.tasks.unshift({ id: crypto.randomUUID(), ...payload, comments: [] });
    if (payload.module && !state.options.modules.includes(payload.module)) state.options.modules.push(payload.module);
    commit(); $("taskDialog").close(); toast(id ? "บันทึกการแก้ไขแล้ว" : "เพิ่มงานแล้ว");
  });
  function openDetail(id) {
    const task = taskById(id); if (!task) return; activeDetailId = id;
    $("detailTitle").textContent = task.title;
    const p = { low: "ต่ำ", medium: "ปานกลาง", high: "สูง" }[task.priority] || "ปานกลาง";
    $("detailContent").innerHTML = `<div class="detail-meta"><span class="tag">${esc(task.module || "ไม่ระบุโมดูล")}</span><span class="priority ${esc(task.priority)}">${p}</span><span class="tag">${esc(statusLabel(task.status))}</span>${(task.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div><div class="detail-grid"><div class="detail-field"><small>ผู้รับผิดชอบ</small><strong>${esc(task.assignee || "ยังไม่ระบุ")}</strong></div><div class="detail-field"><small>ผู้มอบหมาย</small><strong>${esc(task.creator || "ยังไม่ระบุ")}</strong></div><div class="detail-field"><small>วันที่และเวลาที่มอบหมาย</small><strong>${esc(dateLabel(task.assignedAt, true))}</strong></div><div class="detail-field"><small>กำหนดส่ง</small><strong>${esc(dateLabel(task.dueAt, true))}</strong></div></div><p class="detail-description">${esc(task.description || "ไม่มีรายละเอียดเพิ่มเติม")}</p>`;
    renderComments(task); $("detailDialog").showModal();
  }
  function renderComments(task) {
    const comments = task.comments || []; $("commentCount").textContent = comments.length;
    $("commentList").innerHTML = comments.length ? comments.map(c => `<article class="comment-item"><i class="mini-avatar">${esc((c.author || "?").charAt(0))}</i><div class="comment-body"><div class="comment-author"><span>${esc(c.author || "สมาชิกทีม")}</span><time>${esc(dateLabel(c.createdAt, true))}</time></div><p class="comment-text">${esc(c.text)}</p></div></article>`).join("") : `<div class="comment-empty">ยังไม่มีความคิดเห็น เริ่มบทสนทนาได้เลย</div>`;
  }
  $("commentForm").addEventListener("submit", e => {
    e.preventDefault(); const task = taskById(activeDetailId), text = $("commentInput").value.trim(); if (!task || !text) return;
    task.comments ||= []; task.comments.push({ id: crypto.randomUUID(), author: session?.user?.email || "สมาชิกทีม", text, createdAt: new Date().toISOString() });
    $("commentInput").value = ""; commit(); renderComments(task); toast("เพิ่มความคิดเห็นแล้ว");
  });
  function openSettings() { renderSettings(); $("settingsDialog").showModal(); }
  function renderSettings() {
    const groups = [{ key: "assignees", title: "ผู้รับผิดชอบ", canEdit: false }, { key: "creators", title: "ผู้มอบหมาย", canEdit: false }, { key: "modules", title: "โมดูล", canEdit: false }, { key: "statuses", title: "สถานะ", canEdit: true }];
    $("settingsContent").innerHTML = groups.map(g => `<section class="setting-group" data-group="${g.key}"><h3>${g.title}</h3><div class="setting-add"><input aria-label="เพิ่ม${g.title}" placeholder="เพิ่ม${g.title}…"><button data-setting-add="${g.key}" aria-label="ยืนยันเพิ่ม">＋</button></div><div class="setting-list">${state.options[g.key].map((item, i) => { const value = typeof item === "string" ? item : item.label; const id = typeof item === "string" ? item : item.id; return `<div class="setting-item" data-index="${i}">${g.canEdit ? `<input aria-label="แก้ไขชื่อ${g.title}" value="${esc(value)}" data-status-id="${esc(id)}">` : `<span>${esc(value)}</span>`}<button class="remove" data-setting-remove="${g.key}" data-id="${esc(id)}" aria-label="ลบ ${esc(value)}">×</button></div>`; }).join("") || `<span class="comment-empty">ยังไม่มีรายการ</span>`}</div></section>`).join("");
    $("settingsContent").querySelectorAll("[data-setting-add]").forEach(btn => btn.addEventListener("click", () => { const input = btn.previousElementSibling, value = input.value.trim(); if (!value) return; const key = btn.dataset.settingAdd; if (key === "statuses") { const id = `custom_${crypto.randomUUID().slice(0, 8)}`; state.options.statuses.push({ id, label: value }); } else if (!state.options[key].includes(value)) state.options[key].push(value); input.value = ""; commit(); renderSettings(); }));
    $("settingsContent").querySelectorAll("[data-setting-remove]").forEach(btn => btn.addEventListener("click", () => { const key = btn.dataset.settingRemove; state.options[key] = state.options[key].filter(x => (typeof x === "string" ? x : x.id) !== btn.dataset.id); commit(); renderSettings(); }));
    $("settingsContent").querySelectorAll("[data-status-id]").forEach(input => input.addEventListener("change", () => { const status = state.options.statuses.find(s => s.id === input.dataset.statusId); if (status && input.value.trim()) { status.label = input.value.trim(); commit(); renderSettings(); } }));
  }
  function exportCsv() {
    const rows = [["ชื่องาน", "โมดูล", "รายละเอียด", "แท็ก", "ผู้รับผิดชอบ", "ผู้มอบหมาย", "ความสำคัญ", "มอบหมายเมื่อ", "กำหนดส่ง", "สถานะ", "ความคิดเห็น"], ...getVisibleTasks().map(t => [t.title, t.module, t.description, (t.tags || []).join(", "), t.assignee, t.creator, { low: "ต่ำ", medium: "ปานกลาง", high: "สูง" }[t.priority], t.assignedAt, t.dueAt, statusLabel(t.status), (t.comments || []).map(c => `${c.author}: ${c.text}`).join(" | ")])];
    const csv = "\uFEFF" + rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `hugcode-workboard-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url); toast("ส่งออกไฟล์สำหรับ Excel แล้ว");
  }
  async function initializeSupabase() {
    const local = loadLocal(); state = local; render();
    if (!hasConfig()) {
      localMode = true;
      updateConnection("โหมดในเครื่อง · ยังไม่ตั้งค่า Supabase", false);
      $("configHelp").hidden = false;
      $("configHelp").innerHTML = "ยังไม่ได้ตั้งค่า Supabase — เปิดไฟล์ <code>supabase-config.js</code> แล้วใส่ Project URL และ publishable/anon key จากนั้นทำตาม README เพื่อสร้างตารางและเปิดใช้งานการซิงก์";
      $("authDialog").showModal(); return;
    }
    const config = window.HUGCODE_SUPABASE_CONFIG;
    try {
      supabase = window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data: { session: current }, error } = await supabase.auth.getSession();
      if (error) throw error;
      session = current;
      if (!session) { updateConnection("ต้องเข้าสู่ระบบ", false); $("authDialog").showModal(); return; }
      $("authDialog").close(); updateConnection("เชื่อมต่อแล้ว", true);
      await loadRemote(); subscribeRealtime();
      supabase.auth.onAuthStateChange((_event, newSession) => { session = newSession; if (!session) { updateConnection("ต้องเข้าสู่ระบบ", false); $("authDialog").showModal(); } else { $("authDialog").close(); updateConnection("เชื่อมต่อแล้ว", true); loadRemote(); subscribeRealtime(); } });
    } catch (error) { console.error(error); updateConnection("ออฟไลน์ · ใช้ข้อมูลในเครื่อง", false); toast("เชื่อมต่อ Supabase ไม่สำเร็จ ข้อมูลในเครื่องยังใช้งานได้", "error"); }
  }
  async function loadRemote() {
    if (!supabase || !session) return;
    const { data, error } = await supabase.from("workboard_state").select("payload, updated_at").eq("id", "shared").maybeSingle();
    if (error) { console.error(error); updateConnection("ซิงก์ไม่สำเร็จ · ใช้ข้อมูลในเครื่อง", false); return; }
    if (data?.payload) { state = normalizeState(data.payload); if (data.updated_at) state.updatedAt = data.updated_at; try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch {} render(); }
    else { await saveRemote(); }
  }
  function subscribeRealtime() {
    if (!supabase || !session) return;
    if (realtime) supabase.removeChannel(realtime);
    realtime = supabase.channel("shared-workboard").on("postgres_changes", { event: "*", schema: "public", table: "workboard_state", filter: "id=eq.shared" }, payload => {
      const remote = payload.new?.payload;
      if (!remote || remote.updatedAt === state.updatedAt) return;
      if (pendingRemote) { pendingRemote = false; return; }
      state = normalizeState(remote); try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch {} render(); updateConnection("ซิงก์ข้อมูลล่าสุดแล้ว", true); toast("บอร์ดได้รับการอัปเดตจากสมาชิกทีม");
    }).subscribe(status => { if (status === "SUBSCRIBED") updateConnection("เชื่อมต่อแล้ว · LIVE", true); });
  }
  $("authForm").addEventListener("submit", async e => {
    e.preventDefault(); $("authError").textContent = "";
    if (!supabase) { toast("กรุณาตั้งค่า Supabase ก่อนเข้าสู่ระบบ", "error"); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email: $("authEmail").value.trim(), password: $("authPassword").value });
    if (error) { $("authError").textContent = error.message === "Invalid login credentials" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : `เข้าสู่ระบบไม่สำเร็จ: ${error.message}`; return; }
    session = data.session; $("authDialog").close(); updateConnection("เชื่อมต่อแล้ว", true); await loadRemote(); subscribeRealtime();
  });
  $("newTask").addEventListener("click", () => openTaskForm());
  $("settingsButton").addEventListener("click", openSettings);
  $("exportButton").addEventListener("click", exportCsv);
  $("accountButton").addEventListener("click", async () => { if (session && confirm("ต้องการออกจากระบบหรือไม่?")) { await supabase.auth.signOut(); session = null; updateConnection("ต้องเข้าสู่ระบบ", false); $("authDialog").showModal(); } else if (!session && !$("authDialog").open) $("authDialog").showModal(); });
  $("clearFilters").addEventListener("click", () => { $("searchInput").value = ""; $("assigneeFilter").value = ""; $("dateFilter").value = ""; $("filterDate").value = ""; render(); });
  ["searchInput", "assigneeFilter", "dateFilter", "filterDate"].forEach(id => $(id).addEventListener(id === "searchInput" ? "input" : "change", render));
  document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => $(btn.dataset.close).close()));
  document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", e => { if (e.target === dialog && dialog.id !== "authDialog") dialog.close(); }));
  document.addEventListener("click", e => { if (!e.target.closest(".menu-wrap")) document.querySelectorAll(".card-menu").forEach(m => m.hidden = true); });
  initializeSupabase();
})();
