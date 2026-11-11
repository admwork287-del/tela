import { createFileRoute } from "@tanstack/react-router";
import notFoundIllustration from "@/assets/not-found-illustration.png";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Página não encontrada - OLX" },
      {
        name: "description",
        content:
          "Não conseguimos localizar a página que você desejava, o produto pode ter sido vendido ou excluído.",
      },
      { property: "og:title", content: "Página não encontrada - OLX" },
      {
        property: "og:description",
        content:
          "Não conseguimos localizar a página que você desejava, o produto pode ter sido vendido ou excluído.",
      },
    ],
  }),
  component: ErrorPage,
});

function ErrorPage() {
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
            Não conseguimos localizar a página que você desejava, o produto pode ter sido vendido ou excluído. Tente fazer uma nova busca.
          </p>
        </div>
      </main>
    </div>
  );
}
