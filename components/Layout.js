// layout.js

import Head from "next/head";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <title>Real-time Homelessness Detection</title>
        <meta
          name="description"
          content="AI-powered homelessness detection and analysis"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav className="bg-black text-white p-4">
        <div className="container mx-auto flex items-center">
          {/* Center */}
          <div className="flex-1 text-center">
            <Link
              href="/"
              className="text-3xl font-bold text-neon-green font-orbitron"
            >
              Homelessness Scout
            </Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
