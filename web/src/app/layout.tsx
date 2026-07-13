import type { Metadata } from "next";
import { Fragment_Mono } from "next/font/google";
import Script from "next/script";
import { ViewTransition } from "react";
import "./globals.css";

const fragmentMono = Fragment_Mono({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steven Mettler",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("sm-theme");if(t!=="light"&&t!=="dark")t="light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={fragmentMono.className}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body>
        <ViewTransition enter="sm-fade-in" exit="sm-fade-out">
          {children}
        </ViewTransition>
      </body>
    </html>
  );
}
