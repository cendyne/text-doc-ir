// ex. scripts/build_npm.ts
import { build, emptyDir } from "https://deno.land/x/dnt@0.37.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./main.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  test: false,
  mappings: {
    "https://deno.land/x/document_ir@0.0.10/index.ts": {
      name: "document-ir",
      version: "0.0.10",
    },
  },
  package: {
    // package.json properties
    name: "text-doc-ir",
    version: Deno.args[0],
    description:
      "Transforms a document intermediate representation into plain text with formatting",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/cendyne/text-doc-ir.git",
    },
    bugs: {
      url: "https://github.com/cendyne/text-doc-ir/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
