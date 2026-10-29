// انسخ هذا الملف كاملاً في سكربت جديد داخل Scriptable وسمِّه: TaskBoard
const SRC = "https://raw.githubusercontent.com/s2daho0omes2/task-board/main/widget.js?t=" + Date.now();
const code = await new Request(SRC).loadString();
await new Function("args", "config", "Script", "ListWidget", "Request", "Alert", "Color", "Font", "Safari",
  "return (async () => {" + code.replace(/^\s*Script\.complete\(\);?\s*$/m, "") + "})()"
)(args, config, Script, ListWidget, Request, Alert, Color, Font, Safari);
Script.complete();
