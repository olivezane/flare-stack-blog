import type { SiteConfig } from "@/features/config/site-config.schema";
import type { ThemeConfig } from "./config";
import type {
  AdminLayoutProps,
  AuthLayoutProps,
  PublicLayoutProps,
  UserLayoutProps,
} from "./layouts";
import type {
  ForgotPasswordPageProps,
  FriendLinksPageProps,
  HomePageProps,
  LoginPageProps,
  PostPageProps,
  PostsPageProps,
  ProfilePageProps,
  RegisterPageProps,
  ResetPasswordPageProps,
  SearchPageProps,
  SubmitFriendLinkPageProps,
  VerifyEmailPageProps,
} from "./pages";

/**
 * 主题契约 — 组件接口
 *
 * 每个主题的 index.ts 必须导出一个满足此接口的对象。
 * TypeScript 在编译时验证主题实现了所有必须的组件。
 *
 * ─── CSS 变量清单 ───
 * 每个主题的 styles/index.css 必须定义以下 CSS 变量（含 :root 和 .dark 双模式）：
 *
 * 标准语义色: --background, --foreground, --muted, --muted-foreground,
 *             --border, --input, --primary, --primary-foreground,
 *             --secondary, --secondary-foreground, --accent, --accent-foreground,
 *             --ring, --destructive, --warning, --info,
 *             --selection, --selection-foreground
 * 布局尺寸:    --radius (大圆角,默认0), --radius-sm (小圆角,默认0),
 *             --page-width (内容区最大宽度,默认80rem)
 * 侧栏:       --sidebar-bg, --sidebar-width (默认18rem),
 *             --sidebar-hover-bg, --sidebar-active-bg, --sidebar-active-text,
 *             --sidebar-active-border
 * 装饰:       --shadow-lg, --separator-color, --icon-opacity
 *
 * @theme 块必须定义:
 *   --font-serif, --font-sans, --font-mono
 *   --color-background 等语义色映射（参考 default 或 fuwari 实现）
 *   --radius
 */
export interface ThemeComponents {
  /** 主题静态配置（数据获取参数等） */
  config: ThemeConfig;
  /** 注入到 document 根节点的主题变量 */
  getDocumentStyle?: (
    siteConfig: SiteConfig,
  ) => React.CSSProperties | undefined;
  /** 公共布局（Navbar + MobileMenu + Footer 的组合） */
  PublicLayout: React.ComponentType<PublicLayoutProps>;
  /** 主页渲染组件 */
  HomePage: React.ComponentType<HomePageProps>;
  /** 主页加载中骨架屏（用于 TanStack Router pendingComponent） */
  HomePageSkeleton: React.ComponentType;

  /** 文章列表页组件 */
  PostsPage: React.ComponentType<PostsPageProps>;
  /** 文章列表页骨架屏 */
  PostsPageSkeleton: React.ComponentType;

  /** 文章详情页组件 */
  PostPage: React.ComponentType<PostPageProps>;
  /** 文章详情页骨架屏 */
  PostPageSkeleton: React.ComponentType;

  /** 友链列表页组件 */
  FriendLinksPage: React.ComponentType<FriendLinksPageProps>;
  /** 友链列表页骨架屏 */
  FriendLinksPageSkeleton: React.ComponentType;

  /** 搜索页组件 */
  SearchPage: React.ComponentType<SearchPageProps>;

  /** 提交友链页组件 */
  SubmitFriendLinkPage: React.ComponentType<SubmitFriendLinkPageProps>;

  /** Auth 布局组件 */
  AuthLayout: React.ComponentType<AuthLayoutProps>;

  /** User 布局组件 */
  UserLayout: React.ComponentType<UserLayoutProps>;

  /** 登录页组件 */
  LoginPage: React.ComponentType<LoginPageProps>;

  /** 注册页组件 */
  RegisterPage: React.ComponentType<RegisterPageProps>;

  /** 找回密码页组件 */
  ForgotPasswordPage: React.ComponentType<ForgotPasswordPageProps>;

  /** 重置密码页组件 */
  ResetPasswordPage: React.ComponentType<ResetPasswordPageProps>;

  /** 邮箱验证页组件 */
  VerifyEmailPage: React.ComponentType<VerifyEmailPageProps>;

  /** 个人资料页组件 */
  ProfilePage: React.ComponentType<ProfilePageProps>;

  /** Toast 通知组件（Sonner 封装） */
  Toaster: React.ComponentType;

  /** 管理后台布局（SideBar + Header + Content Area） */
  AdminLayout: React.ComponentType<AdminLayoutProps>;
}
