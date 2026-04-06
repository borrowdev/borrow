import { getOptions } from "@/remark/utils";
import { createEnvironment, getImports } from "./utils";
import { ADAPTER_OPTIONS } from "./constants";
import { cleanupEnvironment, execUntilExit } from "@/utils";

type AdapterOptions = {
  environment?: string;
};

async function adapterRust(code: string, options: AdapterOptions): Promise<void> {
  const imports = getImports(code);
  const environmentPath = await createEnvironment(code, imports, {
    environmentPath: options.environment,
  });

  try {
    await execUntilExit("cargo run", environmentPath);
  } finally {
    if (!options.environment) {
      await cleanupEnvironment(environmentPath);
    }
  }
}

export default (code: string, metadata: string[]) =>
  adapterRust(code, getOptions(metadata, ADAPTER_OPTIONS));
