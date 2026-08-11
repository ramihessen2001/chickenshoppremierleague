import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    // Standalone Node scripts, run with `node`, not bundled by Next.
    files: ["database/**/*.js"],
    languageOptions: {
      globals: { require: "readonly", module: "writable", process: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  {
    // The Supabase client returns untyped rows for nested selects, and a join
    // may come back as an object or a single-element array depending on the
    // relationship. These modules are the boundary where that shapeless data is
    // narrowed into the typed models the rest of the app uses, so `any` is the
    // honest type here rather than a fiction we assert past.
    files: ["lib/supabaseData.ts", "lib/supabaseAwards.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
