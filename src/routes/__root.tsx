import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { Header } from "@/components/olx/Header";
import { Footer } from "@/components/olx/Footer";
import { Toaster } from "sonner";
import { initAdminAuth } from "@/lib/admin/store";
import notFoundIllustration from "@/assets/not-found-illustration.png";

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <main className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-6 py-16 md:py-24 max-w-4xl mx-auto">
        <div className="flex-shrink-0">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#ECEEF3] flex items-center justify-center overflow-hidden">
            <img
              src={notFoundIllustration}
              alt="Ilustração"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-[#212529] mb-4">
            A página não foi encontrada...
          </h1>
          <p className="text-[#6C7A8D] text-base md:text-lg leading-relaxed">
            Não conseguimos localizar a página que você desejava, o produto pode
            ter sido vendido ou excluído. Tente fazer uma nova busca.
          </p>
        </div>
      </main>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-olx-bg px-4 text-center">
      <h1 className="text-xl font-bold text-olx-text">Esta página não carregou</h1>
      <p className="mt-2 text-sm text-olx-text-secondary">
        Algo deu errado. Tente novamente ou volte para o início.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded bg-olx-primary px-4 py-2 text-sm font-bold text-white hover:bg-olx-primary-hover"
        >
          Tentar novamente
        </button>
        <Link
          to="/"
          className="rounded border border-olx-border bg-olx-card px-4 py-2 text-sm font-bold text-olx-text hover:bg-olx-bg"
        >
          Início
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname === "/painel" || pathname.startsWith("/painel/");
  const isAuth = pathname === "/auth" || pathname === "/login" || pathname === "/cadastro";
  const cleanRoutes = new Set(["/compra-segura", "/pix"]);
  const chromeRoutes = new Set(["/", "/avaliacoes", "/garantia"]);
  const isProduct = !isAdmin && !isAuth && !cleanRoutes.has(pathname) && !chromeRoutes.has(pathname);
  const noChrome = isAdmin || isAuth || isProduct || cleanRoutes.has(pathname);

  useEffect(() => {
    if (isAdmin || isAuth) initAdminAuth();
  }, [isAdmin, isAuth]);

  if (noChrome) {
    return (
      <>
        <Outlet />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <>
      <div className="olx-page flex min-h-screen flex-col bg-olx-bg text-olx-text">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" richColors />
    </>
  );
}
