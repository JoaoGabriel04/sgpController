import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";

export const metadata: Metadata = {
  title: "Super Gerenciador de Partidas",
  description: "Gerenciador de partidas do tabuleiro Super Banco Imobiliário",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastContainer />
        {children}
        </body>
    </html>
  );
}
