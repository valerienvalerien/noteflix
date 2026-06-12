import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noteflix — ta mémoire vidéo",
  description:
    "Sauvegarde tes vidéos et idées, retrouve-les des mois plus tard en langage naturel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">{children}</body>
    </html>
  );
}
