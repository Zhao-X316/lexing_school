/**
 * 解析 autism-video-scriptwriter 产出的 Markdown 剧本（Coze 代码节点：纯 JavaScript）。
 * 兼容：旧版「#### 画面」块 + ``` 代码块；新版「分镜主表」Markdown 表格 +「即梦 · 按镜展开」表。
 *
 * 入口：async function main(args)
 * 入参：优先从 args.params.input 取 Markdown；Coze 常把上游字段挂在 params 下，键名可能是 text/content 等，见 resolveMarkdownInput。
 */

function coerceString(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.value != null) return String(x.value);
  return String(x);
}

/** 规范化换行与 BOM，避免 Coze/Windows 导致表格行匹配失败 */
function normalizeMarkdown(raw) {
  var s = coerceString(raw);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * 从 Coze params（或整段 args）里取出 Markdown 正文。
 * 常见情况：只绑了变量名「剧本」→ params.剧本；或误绑到顶层 args.input。
 */
function resolveMarkdownInput(args) {
  var p = args && args.params;
  if (typeof p === "string" && p.length > 0) return p;

  var candidates = [
    "input",
    "Input",
    "text",
    "content",
    "markdown",
    "md",
    "script",
    "body",
    "message",
    "剧本",
    "output",
    "result",
  ];

  function pick(obj) {
    if (!obj || typeof obj !== "object") return "";
    for (var i = 0; i < candidates.length; i++) {
      var k = candidates[i];
      if (obj[k] != null && coerceString(obj[k]).length > 0) {
        return coerceString(obj[k]);
      }
    }
    var best = "";
    for (var key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      var v = obj[key];
      if (typeof v === "string" && v.indexOf("|") >= 0 && v.indexOf("画面") >= 0) {
        if (v.length > best.length) best = v;
      }
    }
    return best;
  }

  var fromParams = pick(p);
  if (fromParams) return fromParams;
  var fromArgs = pick(args);
  if (fromArgs) return fromArgs;

  if (typeof args === "string") return args;
  return "";
}

function parseTableRow(line) {
  var t = line.trim();
  if (!t.startsWith("|")) return null;
  return t
    .split("|")
    .slice(1, -1)
    .map(function (c) {
      return c.trim();
    });
}

function isSeparatorRow(line) {
  var t = line.replace(/\s/g, "");
  return /^\|[\-:|]+\|?$/.test(t) || /^\|\|[\-:|]+\|\|$/.test(t);
}

function parseMarkdownTable(block) {
  var rows = [];
  var lines = block.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var row = parseTableRow(line);
    if (!row) continue;
    if (isSeparatorRow(line)) continue;
    rows.push(row);
  }
  return rows;
}

function findHeaderRowIndex(rows, keywords) {
  for (var i = 0; i < rows.length; i++) {
    var joined = rows[i].join(" ");
    var ok = true;
    for (var k = 0; k < keywords.length; k++) {
      if (joined.indexOf(keywords[k]) < 0) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

function parseDurationSeconds(timeCell) {
  var m = timeCell.match(/(\d+)\s*[″"]?\s*[–-]\s*(\d+)\s*[″"]?/);
  if (!m) return 5;
  var a = parseInt(m[1], 10);
  var b = parseInt(m[2], 10);
  return Math.max(1, b - a);
}

function unwrapBackticks(cell) {
  var s = cell.trim();
  var m = s.match(/^`([\s\S]*)`$/);
  return m ? m[1].trim() : s;
}

function cleanImageSuffix(raw) {
  return raw.replace(/（[^）]*角色参考[^）]*）/g, "").trim();
}

function extractStylePrefix(input) {
  var block = input.match(/统一风格前缀[\s\S]*?`([^`]+)`/);
  if (block) return block[1].trim();
  var line = input.match(/`日系动漫风格[^`]+`/);
  return line ? line[0].replace(/`/g, "").trim() : "";
}

function parseJimengExpandTable(input) {
  var map = new Map();
  var start = input.search(/###\s*即梦\s*[·.]?\s*按镜展开/i);
  if (start < 0) return map;
  var endCandidates = [
    input.indexOf("\n## ", start + 5),
    input.indexOf("\n---\n## ", start),
  ].filter(function (n) {
    return n > start;
  });
  var end = endCandidates.length ? Math.min.apply(null, endCandidates) : input.length;
  var text = input.slice(start, end);
  var rows = parseMarkdownTable(text);
  var hi = findHeaderRowIndex(rows, ["画面", "即梦"]);
  if (hi < 0) return map;

  var header = rows[hi];
  function norm(h) {
    return h.replace(/\s/g, "");
  }
  var idxScene = header.findIndex(function (h) {
    return norm(h) === "画面";
  });
  var idxImg = header.findIndex(function (h) {
    var n = norm(h);
    return n.indexOf("即梦") >= 0 && n.indexOf("图片") >= 0 && n.indexOf("视频") < 0;
  });
  var idxVid = header.findIndex(function (h) {
    var n = norm(h);
    return n.indexOf("即梦") >= 0 && n.indexOf("视频") >= 0;
  });
  if (idxScene < 0 || idxImg < 0 || idxVid < 0) return map;

  for (var r = hi + 1; r < rows.length; r++) {
    var row = rows[r];
    if (row.length < Math.max(idxScene, idxImg, idxVid) + 1) continue;
    var num = parseInt(String(row[idxScene]).replace(/\D/g, ""), 10);
    if (isNaN(num)) continue;
    var imgCell = row[idxImg] || "";
    var vidCell = row[idxVid] || "";
    imgCell = unwrapBackticks(imgCell);
    imgCell = cleanImageSuffix(imgCell);
    map.set(num, { imgSuffix: imgCell.trim(), video: vidCell.trim() });
  }
  return map;
}

function extractMainStoryboardTableText(input) {
  var lines = input.split("\n");
  var start = -1;
  for (var i = 0; i < lines.length; i++) {
    if (/\|\s*画面\s*\|\s*时间段\s*\|\s*口播/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) return "";
  var out = [];
  for (var j = start; j < lines.length; j++) {
    var line = lines[j];
    var t = line.trim();
    if (out.length > 2 && t === "---") break;
    if (out.length > 2 && /^###\s/.test(t)) break;
    if (out.length > 2 && /^##\s/.test(t)) break;
    if (t.startsWith("|")) {
      out.push(line);
      continue;
    }
    if (t === "" && out.length > 0) {
      var nextLine = lines[j + 1];
      var next = nextLine && nextLine.trim ? nextLine.trim() : "";
      if (next.startsWith("|")) continue;
      break;
    }
    if (out.length > 0) break;
  }
  return out.join("\n");
}

function parseMainStoryboardTable(input) {
  var text = extractMainStoryboardTableText(input) || input;
  var rows = parseMarkdownTable(text);
  var hi = findHeaderRowIndex(rows, ["画面", "时间段", "口播"]);
  if (hi < 0) return null;

  var header = rows[hi].map(function (h) {
    return h.replace(/\s/g, "");
  });
  var idx = {};
  for (var c = 0; c < header.length; c++) {
    var h = header[c];
    if (h === "画面") idx.scene = c;
    if (h.indexOf("时间段") >= 0) idx.time = c;
    if (h.indexOf("口播") >= 0) idx.voiceover = c;
    if (h.indexOf("字幕") >= 0) idx.subtitles = c;
    if (h.indexOf("画面描述") >= 0) idx.description = c;
    if (h.indexOf("视觉") >= 0 || h.indexOf("[视觉]") >= 0) idx.visual = c;
    if (h.indexOf("即梦") >= 0 && h.indexOf("图片") >= 0 && h.indexOf("视频") < 0) idx.img = c;
    if (h.indexOf("即梦") >= 0 && h.indexOf("视频") >= 0) idx.video = c;
  }

  var data = [];
  for (var r = hi + 1; r < rows.length; r++) {
    var row = rows[r];
    if (row.length < 3) continue;
    var rec = {};
    if (idx.scene !== undefined) rec.scene = row[idx.scene] || "";
    if (idx.time !== undefined) rec.time = row[idx.time] || "";
    if (idx.voiceover !== undefined) rec.voiceover = row[idx.voiceover] || "";
    if (idx.subtitles !== undefined) rec.subtitles = row[idx.subtitles] || "";
    if (idx.description !== undefined) rec.description = row[idx.description] || "";
    if (idx.visual !== undefined) rec.visual = row[idx.visual] || "";
    if (idx.img !== undefined) rec.img = row[idx.img] || "";
    if (idx.video !== undefined) rec.video = row[idx.video] || "";
    data.push(rec);
  }
  return { rows: data, header: rows[hi] };
}

/** 兼容无 String.prototype.matchAll 的环境（不依赖 RegExp.prototype.flags） */
function execAllGlobal(regex, str) {
  var g = new RegExp(regex.source, "g");
  var out = [];
  var m;
  while ((m = g.exec(str)) !== null) out.push(m);
  return out;
}

function parseLegacySceneBlocks(input) {
  var sceneBlocks = input.split(/####\s*画面/).slice(1);
  var scenes = [];

  function extractField(block, labelName) {
    var regex = new RegExp(
      labelName + "[\\s\\*：:]+([\\s\\S]*?)(?=\\n\\n|\\n\\*|字幕文本|画面描述|即梦|#{1,4}|\\s*[`]{3}|$)",
      "i"
    );
    var match = block.match(regex);
    return match ? match[1].trim() : "";
  }

  for (var b = 0; b < sceneBlocks.length; b++) {
    var block = sceneBlocks[b];
    var durationMatch = block.match(/\|\s*(\d+)[″"]?[–-](\d+)[″"]?\s*\|/);
    var duration = 5;
    if (durationMatch) {
      duration = parseInt(durationMatch[2], 10) - parseInt(durationMatch[1], 10);
    }

    var voiceover = extractField(block, "口播文案");
    var subtitles = extractField(block, "字幕文本");
    var description = extractField(block, "画面描述");

    var codeBlocks = execAllGlobal(/```[\s\S]*?\n([\s\S]*?)\n```/g, block);
    var image_prompt = codeBlocks[0] ? codeBlocks[0][1].trim() : "";
    var video_prompt = codeBlocks[1] ? codeBlocks[1][1].trim() : "";

    scenes.push({
      voiceover: voiceover,
      subtitles: subtitles,
      description: description,
      image_prompt: image_prompt,
      video_prompt: video_prompt,
      duration: duration,
    });
  }
  return scenes;
}

function stripMarkdownBold(s) {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
}

function parseTableFormat(input) {
  var stylePrefix = extractStylePrefix(input);
  var jimengMap = parseJimengExpandTable(input);
  var main = parseMainStoryboardTable(input);
  if (!main || main.rows.length === 0) return [];

  var scenes = [];
  for (var i = 0; i < main.rows.length; i++) {
    var rec = main.rows[i];
    var sceneNum = parseInt(String(rec.scene || "").replace(/\D/g, ""), 10);
    var duration = parseDurationSeconds(rec.time || "");

    var image_prompt = (rec.img || "").trim();
    var video_prompt = (rec.video || "").trim();

    var refDown =
      /见下|同上|待补|见「即梦」|即梦.*表/i.test(image_prompt) ||
      image_prompt.length < 2;
    var videoDown = /见下|同上|待补/i.test(video_prompt) || video_prompt.length < 2;

    if (jimengMap.has(sceneNum)) {
      var j = jimengMap.get(sceneNum);
      if (refDown) {
        image_prompt = stylePrefix ? stylePrefix + j.imgSuffix : j.imgSuffix;
      } else if (
        image_prompt.indexOf("日系动漫") < 0 &&
        stylePrefix &&
        j.imgSuffix
      ) {
        image_prompt = stylePrefix + unwrapBackticks(image_prompt);
      }
      if (videoDown) video_prompt = j.video;
    } else {
      if (
        stylePrefix &&
        image_prompt &&
        image_prompt.indexOf("日系动漫") < 0 &&
        !refDown
      ) {
        image_prompt = stylePrefix + unwrapBackticks(image_prompt);
      }
    }

    image_prompt = stripMarkdownBold(image_prompt);

    scenes.push({
      sceneIndex: sceneNum,
      voiceover: stripMarkdownBold(rec.voiceover || ""),
      subtitles: stripMarkdownBold(rec.subtitles || ""),
      description: stripMarkdownBold(rec.description || ""),
      image_prompt: image_prompt.trim(),
      video_prompt: video_prompt.trim(),
      duration: duration,
    });
  }
  return scenes;
}

/**
 * Coze 代码节点入口：平台会调用 main({ params }) 或传入不同结构，见 resolveMarkdownInput。
 */
async function main(args) {
  args = args || {};
  var input = normalizeMarkdown(resolveMarkdownInput(args));

  var scenes = [];
  if (input.length > 0 && /####\s*画面/.test(input)) {
    scenes = parseLegacySceneBlocks(input);
  }
  if (scenes.length === 0 && input.length > 0) {
    scenes = parseTableFormat(input);
  }

  var out = {
    scenes: scenes,
    voiceovers: scenes.map(function (s) {
      return s.voiceover;
    }),
    subtitles: scenes.map(function (s) {
      return s.subtitles;
    }),
    image_prompts: scenes.map(function (s) {
      return s.image_prompt;
    }),
    video_prompts: scenes.map(function (s) {
      return s.video_prompt;
    }),
    durations: scenes.map(function (s) {
      return String(s.duration);
    }),
  };

  if (scenes.length === 0) {
    out.parse_hint =
      input.length === 0
        ? "未收到 Markdown：请在代码节点把「上游输出的剧本全文」绑定到 params，且字段名用 input；若用中文变量名，需映射到 params.剧本 等，或把变量名改为 input。"
        : "未解析到分镜：请确认正文含 Markdown 表格表头「| 画面 | 时间段 | 口播文案 |」；若为纯文本或非表格格式，无法解析。";
    out._input_length = input.length;
  }

  return out;
}

// 本地 Node 测试：node -e "require('./parse-script-board.js').main({params:{input:''}}).then(console.log)"
if (typeof module !== "undefined" && module.exports) {
  module.exports.main = main;
}
