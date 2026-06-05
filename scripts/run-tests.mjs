import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  return result.status || 0;
}

const forwardedArgs = process.argv.slice(2);

if (forwardedArgs.length > 0) {
  process.exitCode = run("node", ["--test", ...forwardedArgs]);
} else {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const nodeStatus = run(npmCommand, ["run", "test:node"]);
  if (nodeStatus !== 0) {
    process.exitCode = nodeStatus;
  } else {
    process.exitCode = run(npmCommand, ["run", "test:deno"]);
  }
}
