import { adapterWrapperJavaScript } from "../javascript";

export default (code: string, metadata: string[]) =>
  adapterWrapperJavaScript(code, metadata, "jsx");
