import adapterJavaScript from "./javascript";
import adapterJSX from "./jsx";
import adapterRust from "./rust";
import adapterTSX from "./tsx";
import adapterTypeScript from "./typescript";

const map = {
  javascript: adapterJavaScript,
  js: adapterJavaScript,
  typescript: adapterTypeScript,
  ts: adapterTypeScript,
  jsx: adapterJSX,
  tsx: adapterTSX,
  rust: adapterRust,
  rs: adapterRust,
} as const;

type Language = keyof typeof map;

export { Language };
export default map;
