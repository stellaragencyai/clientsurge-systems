import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const taskFile = path.join(repoRoot, "src", "MASTER_TASK_LIST.md");
const controlFile = path.join(repoRoot, "docs", "agent-task-control-center.md");

function parseTasks(markdown) {
  const tasks = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(
      /^\|\s*(\d+)\s*\|\s*([✅🔄⏳❌])\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/u
    );
    if (!match) {
      continue;
    }

    tasks.push({
      id: Number(match[1]),
      status: match[2],
      task: match[3].trim(),
      priority: match[4].trim(),
    });
  }
  return tasks;
}

function replaceOrThrow(content, pattern, replacement, label) {
  if (!pattern.test(content)) {
    throw new Error(`Could not update ${label}`);
  }
  return content.replace(pattern, replacement);
}

const taskContent = fs.readFileSync(taskFile, "utf8");
const controlContent = fs.readFileSync(controlFile, "utf8");
const tasks = parseTasks(taskContent);

const maxId = Math.max(...tasks.map((task) => task.id));
const rowCount = tasks.length;
const inProgress = tasks.filter((task) => task.status === "🔄").map((task) => `#${task.id}`);
const completeCount = tasks.filter((task) => task.status === "✅").length;
const inProgressCount = tasks.filter((task) => task.status === "🔄").length;
const pendingCount = tasks.filter((task) => task.status === "⏳").length;
const blockedCount = tasks.filter((task) => task.status === "❌").length;

const duplicateIds = new Map();
for (const task of tasks) {
  duplicateIds.set(task.id, (duplicateIds.get(task.id) || 0) + 1);
}

const duplicateRows = [...duplicateIds.entries()]
  .filter(([, count]) => count > 1)
  .sort((a, b) => a[0] - b[0]);

const duplicateNote =
  duplicateRows.length === 0
    ? "none"
    : duplicateRows
        .map(([id, count]) => `\`#${id}\` appears ${count} times`)
        .join("; ") + "; use split suffixes like `#213a` / `#213b` in audit and control notes until renumbered";

let nextTaskContent = taskContent;
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^> \*\*Planned Task IDs:\*\* .*$/m,
  `> **Planned Task IDs:** ${maxId}`,
  "master planned task ids"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^> \*\*Current Rows In File:\*\* .*$/m,
  `> **Current Rows In File:** ${rowCount}`,
  "master row count"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^> \*\*Duplicate ID Note:\*\* .*$/m,
  `> **Duplicate ID Note:** ${duplicateNote}`,
  "master duplicate note"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^> \*\*Current Row Status Snapshot:\*\* .*$/m,
  `> **Current Row Status Snapshot:** ✅ ${completeCount} | 🔄 ${inProgressCount} | ⏳ ${pendingCount} | ❌ ${blockedCount}`,
  "master status snapshot"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^> \*\*Tasks locked:\*\* .*$/m,
  `> **Tasks locked:** ${inProgress.join(", ") || "none"}`,
  "master lock list"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^\| Planned task IDs \| .*$/m,
  `| Planned task IDs | ${maxId} | Expansion pack extends the backlog through \`#${maxId}\` |`,
  "master progress planned ids"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^\| Current task rows \| .*$/m,
  `| Current task rows | ${rowCount} | ${duplicateRows.length ? "Duplicate task IDs still need cleanup" : "No duplicate task IDs detected"} |`,
  "master progress row count"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^\| Complete rows \| .*$/m,
  `| Complete rows | ${completeCount} | Status rows after latest truth cleanup and sync |`,
  "master progress complete count"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^\| In-progress rows \| .*$/m,
  `| In-progress rows | ${inProgressCount} | These are the currently locked rows |`,
  "master progress in-progress count"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^\| Pending rows \| .*$/m,
  `| Pending rows | ${pendingCount} | Includes tasks that still need implementation or live proof |`,
  "master progress pending count"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^\| Blocked rows \| .*$/m,
  `| Blocked rows | ${blockedCount} | Reserve \`❌\` for explicit dependency waits |`,
  "master progress blocked count"
);
nextTaskContent = replaceOrThrow(
  nextTaskContent,
  /^\| Current lock set \| .*$/m,
  `| Current lock set | ${inProgressCount} | ${inProgress.join(", ") || "none"} |`,
  "master progress lock set"
);

let nextControlContent = controlContent;
nextControlContent = replaceOrThrow(
  nextControlContent,
  /^\| Planned task IDs \| .*$/m,
  `| Planned task IDs | ${maxId} | Backlog extends through \`#${maxId}\` |`,
  "control planned ids"
);
nextControlContent = replaceOrThrow(
  nextControlContent,
  /^\| Current task rows \| .*$/m,
  `| Current task rows | ${rowCount} | ${duplicateRows.length ? "Duplicate task IDs still need cleanup" : "No duplicate task IDs detected"} |`,
  "control row count"
);
nextControlContent = replaceOrThrow(
  nextControlContent,
  /^\| Status counts \| .*$/m,
  `| Status counts | \`✅ ${completeCount} / 🔄 ${inProgressCount} / ⏳ ${pendingCount} / ❌ ${blockedCount}\` | This is the row-state snapshot from the latest repo audit |`,
  "control status counts"
);

fs.writeFileSync(taskFile, nextTaskContent, "utf8");
fs.writeFileSync(controlFile, nextControlContent, "utf8");

console.log(
  JSON.stringify(
    {
      taskFile: path.relative(repoRoot, taskFile),
      controlFile: path.relative(repoRoot, controlFile),
      maxId,
      rowCount,
      completeCount,
      inProgressCount,
      pendingCount,
      blockedCount,
      duplicateRows,
      inProgress,
    },
    null,
    2
  )
);
