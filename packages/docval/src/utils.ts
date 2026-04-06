import { spawn } from "child_process";

function execUntilExit(command: string, cwd: string): Promise<void> {
  let error = "";
  return new Promise((resolve, reject) => {
    const process = spawn(command, { cwd, shell: true });

    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    process.stderr.on("data", (data) => {
      error += data;
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Command failed with exit code ${code}\n${error})`);
      }
    });
  });
}

async function cleanupEnvironment(path: string) {
  await execUntilExit(`rm -rf ${path}`, process.cwd());
}

export { execUntilExit, cleanupEnvironment };
