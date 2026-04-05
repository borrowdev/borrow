import adapterJavaScript from "./javascript";

const map: { [key: string]: (code: string, metadata: string[]) => Promise<void> } = {
  javascript: adapterJavaScript,
  js: adapterJavaScript,
};

export default map;
