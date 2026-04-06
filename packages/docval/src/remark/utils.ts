import { hash } from "crypto";

function getFilename(_metadata: string[], code: string): string {
  // TODO: Use filename metadata to provide better error messages pointing to the exact codeblock.
  // const filenameIndex = metadata.findIndex((item) => item.startsWith("filename="));
  // if (filenameIndex !== -1) {
  //   return metadata[filenameIndex].split("=")[1];
  // }
  return hash("sha1", code);
}

export function getOptions<T extends Record<string, string | string[] | undefined>>(
  metadata: string[],
  defaultOptions: T,
): T {
  let options = { ...defaultOptions };
  metadata.forEach((item) => {
    const pairs: [string, string | string[]][] = [];
    const [key, ...rest] = item.split("=");
    const value = rest.join("=").replace(/^["']|["']$/g, "");
    if (!key || !value) return;
    pairs.push([key, value.includes(",") ? value.split(",") : value]);
    Object.fromEntries(pairs);
    options = { ...options, ...Object.fromEntries(pairs) };
  });
  return options as T;
}

export { getFilename };
