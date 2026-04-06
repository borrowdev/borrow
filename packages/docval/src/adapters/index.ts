import adapterJavaScript from "./javascript";
import adapterJSX from "./jsx";
import adapterRust from "./rust";
import adapterTSX from "./tsx";
import adapterTypeScript from "./typescript";

const map: { [key: string]: (code: string, metadata: string[]) => Promise<void> } = {
  javascript: adapterJavaScript,
  js: adapterJavaScript,
  typescript: adapterTypeScript,
  ts: adapterTypeScript,
  jsx: adapterJSX,
  tsx: adapterTSX,
  rust: adapterRust,
  rs: adapterRust,
};

export default map;
