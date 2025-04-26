import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import Image from "next/image";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Borrow | Documentation",
};

const footer = <Footer>MIT {new Date().getFullYear()} © Borrow</Footer>;

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body
        style={{
          fontFamily: ["-apple-system", inter.style.fontFamily].join(", "),
        }}
        className="min-h-screen flex flex-col"
      >
        <Layout
          navbar={
            <Navbar
              logoLink="https://borrow.dev"
              projectLink="https://github.com/borrowdev/borrow"
              logo={
                <Image
                  src="https://borrow.dev/logo.svg"
                  width={35}
                  height={35}
                  alt="Borrow logo"
                />
              }
              className="bg-background/90 rounded-t-xl"
            />
          }
          pageMap={await getPageMap()}
          feedback={{
            content: "Give us feedback",
            labels: "feedback",
          }}
          sidebar={{
            autoCollapse: true,
            toggleButton: false,
          }}
          darkMode={false}
          docsRepositoryBase="https://github.com/borrowdev/borrow/tree/main/apps/docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
