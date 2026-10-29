const SRC = "https://raw.githubusercontent.com/s2daho0omes2/task-board/main/widget.js?t=" + Date.now();
let code = await new Request(SRC).loadString();
code = code.replace(/[‎‏‪-‮﻿]/g, "").replace(/^\s*Script\.complete\(\);?\s*$/m, "");
await new Function("args", "config", "Script", "ListWidget", "Request", "Alert", "Color", "Font", "Safari",
  "return (async () => {" + code + "})()"
)(args, config, Script, ListWidget, Request, Alert, Color, Font, Safari);
Script.complete();
