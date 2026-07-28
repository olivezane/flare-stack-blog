import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const THEMES_DIR = path.join(process.cwd(), "src/features/theme/themes");

const THEME_NAME_REGEX = /^[a-z0-9-]+$/;

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }
  fs.writeFileSync(filePath, content, "utf-8");
}

function createTheme(name: string): void {
  const themeDir = path.join(THEMES_DIR, name);

  if (fs.existsSync(themeDir)) {
    console.error(`\n错误：主题 "${name}" 已存在，目录 ${themeDir} 不为空。`);
    process.exit(1);
  }

  const files: Array<{ path: string; content: string }> = [];

  // styles/index.css
  files.push({
    path: path.join(themeDir, "styles/index.css"),
    content: `/* Theme: ${name} */\n@import "tailwindcss";\n@import "@/styles/shared.css";\n@import "@fontsource-variable/noto-sans-sc";\n@import "@fontsource-variable/noto-serif-sc";\n@import "@fontsource-variable/jetbrains-mono";\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 240 10% 3.9%;\n    --muted: 240 4.8% 95.9%;\n    --muted-foreground: 240 3.8% 46.1%;\n    --popover: 0 0% 100%;\n    --popover-foreground: 240 10% 3.9%;\n    --border: 240 5.9% 90%;\n    --input: 240 5.9% 90%;\n    --primary: 240 10% 3.9%;\n    --primary-foreground: 0 0% 98%;\n    --secondary: 240 4.8% 95.9%;\n    --secondary-foreground: 240 5.9% 10%;\n    --accent: 240 4.8% 95.9%;\n    --accent-foreground: 240 5.9% 10%;\n    --ring: 240 10% 3.9%;\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 0 0% 98%;\n    --warning: 38 92% 50%;\n    --warning-foreground: 0 0% 100%;\n    --info: 221.2 83.2% 53.3%;\n    --info-foreground: 0 0% 100%;\n    --selection: 240 10% 3.9%;\n    --selection-foreground: 0 0% 100%;\n    --radius: 0px;\n    --radius-sm: 0px;\n    --page-width: 80rem;\n    --sidebar-bg: var(--background);\n    --sidebar-width: 18rem;\n    --sidebar-hover-bg: transparent;\n    --sidebar-active-bg: var(--foreground);\n    --sidebar-active-text: var(--background);\n    --sidebar-active-border: var(--foreground);\n    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);\n  }\n\n  .dark {\n    --background: 240 10% 3.9%;\n    --foreground: 0 0% 98%;\n    --muted: 240 3.7% 15.9%;\n    --muted-foreground: 240 5% 64.9%;\n    --popover: 240 10% 3.9%;\n    --popover-foreground: 0 0% 98%;\n    --border: 240 3.7% 15.9%;\n    --input: 240 3.7% 15.9%;\n    --primary: 0 0% 98%;\n    --primary-foreground: 240 10% 3.9%;\n    --secondary: 240 3.7% 15.9%;\n    --secondary-foreground: 0 0% 98%;\n    --accent: 240 3.7% 15.9%;\n    --accent-foreground: 0 0% 98%;\n    --ring: 240 4.9% 83.9%;\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 0 0% 98%;\n    --warning: 48 96% 89%;\n    --warning-foreground: 38 92% 50%;\n    --info: 217.2 91.2% 59.8%;\n    --info-foreground: 0 0% 100%;\n    --selection: 0 0% 100%;\n    --selection-foreground: 240 10% 3.9%;\n    --foreground: 0 0% 98%;\n    --popover-foreground: 0 0% 98%;\n    --secondary: 240 3.7% 15.9%;\n    --secondary-foreground: 0 0% 98%;\n    --accent: 240 3.7% 15.9%;\n    --accent-foreground: 0 0% 98%;\n  }\n}\n\n@theme {\n  --tw-transition-duration: 0.3s;\n  --font-serif: "Noto Serif SC Variable", serif;\n  --font-sans: "Noto Sans SC Variable", system-ui, sans-serif;\n  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;\n  --radius: 0px;\n\n  --color-background: hsl(var(--background));\n  --color-foreground: hsl(var(--foreground));\n  --color-muted: hsl(var(--muted));\n  --color-muted-foreground: hsl(var(--muted-foreground));\n  --color-popover: hsl(var(--popover));\n  --color-popover-foreground: hsl(var(--popover-foreground));\n  --color-border: hsl(var(--border));\n  --color-input: hsl(var(--input));\n  --color-primary: hsl(var(--primary));\n  --color-primary-foreground: hsl(var(--primary-foreground));\n  --color-secondary: hsl(var(--secondary));\n  --color-secondary-foreground: hsl(var(--secondary-foreground));\n  --color-accent: hsl(var(--accent));\n  --color-accent-foreground: hsl(var(--accent-foreground));\n  --color-ring: hsl(var(--ring));\n  --color-destructive: hsl(var(--destructive));\n  --color-destructive-foreground: hsl(var(--destructive-foreground));\n  --color-warning: hsl(var(--warning));\n  --color-warning-foreground: hsl(var(--warning-foreground));\n  --color-info: hsl(var(--info));\n  --color-info-foreground: hsl(var(--info-foreground));\n  --color-selection: hsl(var(--selection));\n  --color-selection-foreground: hsl(var(--selection-foreground));\n}\n`,
  });

  // layouts
  files.push({
    path: path.join(themeDir, "layouts/public-layout.tsx"),
    content: `import type { PublicLayoutProps } from "@/features/theme/contract/layouts";

export function PublicLayout(_props: PublicLayoutProps) {
  return <div>Placeholder: PublicLayout</div>;
}
`,
  });

  files.push({
    path: path.join(themeDir, "layouts/auth-layout.tsx"),
    content: `import type { AuthLayoutProps } from "@/features/theme/contract/layouts";

export function AuthLayout(_props: AuthLayoutProps) {
  return <div>Placeholder: AuthLayout</div>;
}
`,
  });

  files.push({
    path: path.join(themeDir, "layouts/user-layout.tsx"),
    content: `import type { UserLayoutProps } from "@/features/theme/contract/layouts";

export function UserLayout(_props: UserLayoutProps) {
  return <div>Placeholder: UserLayout</div>;
}
`,
  });

  files.push({
    path: path.join(themeDir, "layouts/admin-layout.tsx"),
    content: `import type { AdminLayoutProps } from "@/features/theme/contract/layouts";

export function AdminLayout(_props: AdminLayoutProps) {
  return <div>Placeholder: AdminLayout</div>;
}
`,
  });

  // page + skeleton + index for each page with skeleton
  const pageWithSkeleton = [
    { dir: "home", page: "HomePage", props: "HomePageProps" },
    { dir: "posts", page: "PostsPage", props: "PostsPageProps" },
    { dir: "post", page: "PostPage", props: "PostPageProps" },
    {
      dir: "friend-links",
      page: "FriendLinksPage",
      props: "FriendLinksPageProps",
    },
  ] as const;

  for (const { dir, page, props } of pageWithSkeleton) {
    const base = path.join(themeDir, "pages", dir);
    files.push({
      path: path.join(base, "page.tsx"),
      content: `import type { ${props} } from "@/features/theme/contract/pages";

export function ${page}(_props: ${props}) {
  return <div>Placeholder: ${page}</div>;
}
`,
    });
    files.push({
      path: path.join(base, "skeleton.tsx"),
      content: `export function ${page}Skeleton() {
  return <div>Placeholder: ${page}Skeleton</div>;
}
`,
    });
    files.push({
      path: path.join(base, "index.ts"),
      content: `export { ${page} } from "./page";
export { ${page}Skeleton } from "./skeleton";
`,
    });
  }

  // Standard pages (page + index only)
  const standardPages = [
    { dir: "search", page: "SearchPage", props: "SearchPageProps" },
    {
      dir: "submit-friend-link",
      page: "SubmitFriendLinkPage",
      props: "SubmitFriendLinkPageProps",
    },
    { dir: "auth/login", page: "LoginPage", props: "LoginPageProps" },
    { dir: "auth/register", page: "RegisterPage", props: "RegisterPageProps" },
    {
      dir: "auth/forgot-password",
      page: "ForgotPasswordPage",
      props: "ForgotPasswordPageProps",
    },
    {
      dir: "auth/reset-password",
      page: "ResetPasswordPage",
      props: "ResetPasswordPageProps",
    },
    {
      dir: "auth/verify-email",
      page: "VerifyEmailPage",
      props: "VerifyEmailPageProps",
    },
  ] as const;

  for (const { dir, page, props } of standardPages) {
    const base = path.join(themeDir, "pages", dir);
    files.push({
      path: path.join(base, "page.tsx"),
      content: `import type { ${props} } from "@/features/theme/contract/pages";

export function ${page}(_props: ${props}) {
  return <div>Placeholder: ${page}</div>;
}
`,
    });
    files.push({
      path: path.join(base, "index.ts"),
      content: `export { ${page} } from "./page";
`,
    });
  }

  // user/profile
  const profileBase = path.join(themeDir, "pages/user/profile");
  files.push({
    path: path.join(profileBase, "page.tsx"),
    content: `import type { ProfilePageProps } from "@/features/theme/contract/pages";

export function ProfilePage(_props: ProfilePageProps) {
  return <div>Placeholder: ProfilePage</div>;
}
`,
  });
  files.push({
    path: path.join(profileBase, "index.ts"),
    content: `export { ProfilePage } from "./page";
`,
  });

  // config.ts
  files.push({
    path: path.join(themeDir, "config.ts"),
    content: `import type { ThemeConfig } from "@/features/theme/contract/config";

export const config: ThemeConfig = {
  home: {
    recentPostsLimit: 4,
    popularPostsLimit: 5,
  },
  posts: {
    postsPerPage: 12,
  },
  post: {
    relatedPostsLimit: 3,
  },
};
`,
  });

  // index.ts
  files.push({
    path: path.join(themeDir, "index.ts"),
    content: `import "./styles/index.css";
import { HomePage, HomePageSkeleton } from "./pages/home";
import { PostsPage, PostsPageSkeleton } from "./pages/posts";
import { PostPage, PostPageSkeleton } from "./pages/post";
import { PublicLayout } from "./layouts/public-layout";
import { AuthLayout } from "./layouts/auth-layout";
import { UserLayout } from "./layouts/user-layout";
import { AdminLayout } from "./layouts/admin-layout";
import { FriendLinksPage, FriendLinksPageSkeleton } from "./pages/friend-links";
import { SearchPage } from "./pages/search";
import { SubmitFriendLinkPage } from "./pages/submit-friend-link";
import { LoginPage } from "./pages/auth/login";
import { RegisterPage } from "./pages/auth/register";
import { ForgotPasswordPage } from "./pages/auth/forgot-password";
import { ResetPasswordPage } from "./pages/auth/reset-password";
import { VerifyEmailPage } from "./pages/auth/verify-email";
import { ProfilePage } from "./pages/user/profile";
import { config } from "./config";
import Toaster from "@/components/ui/toaster";
import type { SiteConfig } from "@/features/config/site-config.schema";
import type { ThemeComponents } from "@/features/theme/contract/components";

/**
 * Theme: ${name} — implements the full ThemeComponents contract.
 * TypeScript will error at compile time if any required component is missing.
 */
export default {
  config,
  getDocumentStyle: (_siteConfig: SiteConfig) => undefined,
  HomePage,
  HomePageSkeleton,
  PostsPage,
  PostsPageSkeleton,
  PostPage,
  PostPageSkeleton,
  PublicLayout,
  AuthLayout,
  UserLayout,
  AdminLayout,
  FriendLinksPage,
  FriendLinksPageSkeleton,
  SearchPage,
  SubmitFriendLinkPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  ProfilePage,
  Toaster,
} satisfies ThemeComponents;
`,
  });

  for (const { path: filePath, content } of files) {
    writeFile(filePath, content);
  }

  console.log(`\n✅ 主题 "${name}" 已创建于 ${themeDir}`);
  console.log("\n后续步骤：");
  console.log(
    "  1. 在 src/features/theme/registry.ts 中注册新主题名并配置路由行为（详见 docs/theme-guide.md）",
  );
  console.log(`  2. 在 .env 中设置 THEME=${name} 并启动开发`);
}

async function main() {
  console.log("创建新主题\n");

  const input = await prompt(
    "请输入主题名称（仅允许小写字母、数字、连字符，如 my-theme）: ",
  );

  if (!input) {
    console.error("\n错误：主题名称不能为空。");
    process.exit(1);
  }

  const name = input.toLowerCase().replace(/\s+/g, "-");

  if (!THEME_NAME_REGEX.test(name)) {
    console.error(
      `\n错误：主题名称 "${name}" 无效。仅允许小写字母、数字和连字符（a-z, 0-9, -）。`,
    );
    process.exit(1);
  }

  createTheme(name);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
