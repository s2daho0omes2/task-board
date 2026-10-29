// لوحة المهام — ويدجت Scriptable (iPhone / iPad)
// يعرض المهام المفتوحة، وبالضغط عليه يفتح سطر لإضافة مهمة جديدة تُحفظ في Firebase مباشرة.

const FB = "https://task-board-d3f90-default-rtdb.firebaseio.com/tasks";
const SITE = "https://s2daho0omes2.github.io/task-board/";
const RESERVED = new Set(["workLogData", "parentTasksData", "configData"]);

async function loadTasks() {
  const data = await new Request(FB + ".json").loadJSON();
  return Object.entries(data || {})
    .filter(([k, t]) => !RESERVED.has(k) && t && t.id && t.title)
    .map(([, t]) => t);
}

function uid() {
  let s = "";
  while (s.length < 16) s += Math.random().toString(36).slice(2);
  return s.slice(0, 16);
}

async function addTask(title) {
  const tasks = await loadTasks();
  const num = tasks.reduce((m, t) => Math.max(m, t.num || 0), 0) + 1;
  const t = { id: uid(), num, title, desc: "", status: "new", priority: "normal",
              color: "", deadline: "", assignee: "", created: Date.now(), updates: [] };
  const r = new Request(`${FB}/${t.id}.json`);
  r.method = "PUT";
  r.headers = { "Content-Type": "application/json" };
  r.body = JSON.stringify(t);
  await r.loadJSON();
  return t;
}

async function promptAdd() {
  const a = new Alert();
  a.title = "مهمة جديدة";
  a.addTextField("اكتب عنوان المهمة...");
  a.addAction("إضافة");
  a.addCancelAction("إلغاء");
  if ((await a.present()) !== 0) return;
  const title = a.textFieldValue(0).trim();
  if (!title) return;
  await addTask(title);
  const ok = new Alert();
  ok.title = "تمت الإضافة ✓";
  ok.message = title;
  ok.addAction("حسناً");
  await ok.present();
}

async function buildWidget() {
  const tasks = await loadTasks();
  const open = tasks.filter(t => t.status !== "done")
    .sort((a, b) => (b.created || 0) - (a.created || 0));

  const w = new ListWidget();
  w.backgroundColor = new Color("#0e1116");
  w.setPadding(14, 14, 12, 14);
  w.url = "scriptable:///run/" + encodeURIComponent(Script.name()) + "?action=add";

  const head = w.addStack();
  head.layoutHorizontally();
  const title = head.addText("📋 لوحة المهام");
  title.font = Font.boldSystemFont(15);
  title.textColor = Color.white();
  head.addSpacer();
  const cnt = head.addText(`${open.length} مفتوحة`);
  cnt.font = Font.systemFont(12);
  cnt.textColor = new Color("#8b949e");

  w.addSpacer(8);
  const max = config.widgetFamily === "large" ? 9 : config.widgetFamily === "medium" ? 4 : 2;
  const dot = { new: "🆕", doing: "⚡", wait: "⏸️" };
  for (const t of open.slice(0, max)) {
    const line = w.addText(`${dot[t.status] || "•"} ${t.title}`);
    line.font = Font.systemFont(12);
    line.textColor = new Color("#e6edf3");
    line.lineLimit = 1;
    line.rightAlignText();
    w.addSpacer(3);
  }
  if (!open.length) {
    const e = w.addText("لا توجد مهام مفتوحة 🎉");
    e.font = Font.systemFont(12); e.textColor = new Color("#8b949e");
  }

  w.addSpacer();
  const foot = w.addText("＋ اضغط لإضافة مهمة");
  foot.font = Font.systemFont(10);
  foot.textColor = new Color("#4f9dff");
  foot.rightAlignText();
  return w;
}

if (config.runsInWidget) {
  Script.setWidget(await buildWidget());
} else if (args.queryParameters && args.queryParameters.action === "add") {
  await promptAdd();
} else {
  const m = new Alert();
  m.title = "لوحة المهام";
  m.addAction("＋ إضافة مهمة");
  m.addAction("🌐 فتح الموقع");
  m.addCancelAction("إغلاق");
  const i = await m.present();
  if (i === 0) await promptAdd();
  else if (i === 1) Safari.open(SITE);
}
Script.complete();
