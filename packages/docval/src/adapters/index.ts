import adapterJavaScript from "./javascript";
import adapterJSX from "./jsx";
import adapterTypeScript from "./typescript";

const map: { [key: string]: (code: string, metadata: string[]) => Promise<void> } = {
  javascript: adapterJavaScript,
  js: adapterJavaScript,
  typescript: adapterTypeScript,
  ts: adapterTypeScript,
  jsx: adapterJSX,
};

export default map;
