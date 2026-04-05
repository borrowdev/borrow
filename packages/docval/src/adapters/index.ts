import adapterJavaScript from "./javascript";
import adapterTypeScript from "./typescript";

const map: { [key: string]: (code: string, metadata: string[]) => Promise<void> } = {
  javascript: adapterJavaScript,
  js: adapterJavaScript,
  typescript: adapterTypeScript,
  ts: adapterTypeScript,
};

export default map;
