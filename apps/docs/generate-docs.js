import { generateFiles } from "fumadocs-openapi";
import { openapi } from "./lib/openapi.js";

void generateFiles({
  input: openapi,
  output: "./content/api",
  per: "tag",
  meta: true,
  includeDescription: true,
  addGeneratedComment: true,
});
