import fs from "node:fs";
import path from "node:path";

const REQUIRED_ROOT_VARS = [
  "--background",
  "--foreground",
  "--muted",
  "--muted-foreground",
  "--border",
  "--input",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--destructive",
  "--destructive-foreground",
  "--warning",
  "--warning-foreground",
  "--info",
  "--info-foreground",
  "--selection",
  "--selection-foreground",
  "--radius",
  "--radius-sm",
  "--page-width",
  "--sidebar-bg",
  "--sidebar-width",
  "--sidebar-hover-bg",
  "--sidebar-active-bg",
  "--sidebar-active-text",
  "--sidebar-active-border",
  "--shadow-lg",
];

const REQUIRED_THEME_KEYS = [
  "--font-serif",
  "--font-sans",
  "--font-mono",
  "--color-background",
  "--color-foreground",
  "--color-muted",
  "--color-muted-foreground",
  "--color-border",
  "--color-input",
  "--color-primary",
  "--color-primary-foreground",
  "--color-secondary",
  "--color-secondary-foreground",
  "--color-accent",
  "--color-accent-foreground",
  "--color-ring",
  "--color-destructive",
  "--color-destructive-foreground",
  "--color-warning",
  "--color-warning-foreground",
  "--color-info",
  "--color-info-foreground",
  "--color-selection",
  "--color-selection-foreground",
  "--radius",
];

const REQUIRED_FONT_IMPORTS = [
  "@fontsource-variable/noto-sans-sc",
  "@fontsource-variable/noto-serif-sc",
  "@fontsource-variable/jetbrains-mono",
];

function extractBlock(content: string, blockName: string): string {
  const escaped = blockName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g");
  const matches = content.matchAll(regex);
  const parts: string[] = [];
  for (const m of matches) parts.push(m[1]);
  return parts.join("\n");
}

function extractThemeBlock(content: string): string {
  const match = content.match(/@theme\s*\{([^}]*)\}/);
  return match?.[1] ?? "";
}

function checkVariables(
  block: string,
  required: string[],
  _label: string,
): string[] {
  return required.filter((v) => {
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return !new RegExp(`${escaped}\\s*:`).test(block);
  });
}

function main(): void {
  const theme = process.env.THEME || "default";
  const cssPath = path.resolve(
    process.cwd(),
    `src/features/theme/themes/${theme}/styles/index.css`,
  );

  if (!fs.existsSync(cssPath)) {
    console.error(`❌ 找不到主题 CSS 文件: ${cssPath}`);
    process.exit(1);
  }

  const css = fs.readFileSync(cssPath, "utf-8");
  let exitCode = 0;

  const rootBlock = extractBlock(css, ":root");
  const darkBlock = extractBlock(css, ".dark");
  const themeBlock = extractThemeBlock(css);

  const missingRoot = checkVariables(rootBlock, REQUIRED_ROOT_VARS, ":root");
  if (missingRoot.length > 0) {
    console.error(`❌ :root 缺少 CSS 变量:\n    ${missingRoot.join("\n    ")}`);
    exitCode = 1;
  }

  const darkOverrides = [
    "--foreground",
    "--popover-foreground",
    "--secondary",
    "--secondary-foreground",
    "--accent",
    "--accent-foreground",
    "--warning-foreground",
  ];
  const missingDark = checkVariables(darkBlock, darkOverrides, ".dark");
  if (missingDark.length > 0) {
    console.error(`❌ .dark 缺少 CSS 变量:\n    ${missingDark.join("\n    ")}`);
    exitCode = 1;
  }

  const missingTheme = checkVariables(
    themeBlock,
    REQUIRED_THEME_KEYS,
    "@theme",
  );
  if (missingTheme.length > 0) {
    console.error(`❌ @theme 块缺少:\n    ${missingTheme.join("\n    ")}`);
    exitCode = 1;
  }

  for (const imp of REQUIRED_FONT_IMPORTS) {
    if (!css.includes(imp)) {
      console.error(`❌ 缺少字体导入: ${imp}`);
      exitCode = 1;
    }
  }

  if (!css.includes('@import "tailwindcss"')) {
    console.error('❌ 缺少 @import "tailwindcss"');
    exitCode = 1;
  }

  if (!css.includes('@import "@/styles/shared.css"')) {
    console.error('❌ 缺少 @import "@/styles/shared.css"');
    exitCode = 1;
  }

  if (exitCode === 0) {
    console.log(`✅ 主题 "${theme}" CSS 验证通过`);
  }
  process.exit(exitCode);
}

main();
