import Head from "next/head";
import Link from "next/link";
import Image from "next/image"; 
import logo from "../img/logo.png";

export default function Layout({ children }) {
  return (
    <div className="bg-white text-black p-4">
      <Head>
        <title>Real-time Homelessness Detection</title>
        <meta
          name="description"
          content="AI-powered homelessness detection and analysis"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav>
        <div className="container mx-auto flex items-center justify-between mb-3 mt-2">
          {/* Left: Logo and Name */}
          <div className="flex items-center space-x-2">
            <Image
              src={logo}
              alt="Elevate Logo"
              width={30}
              height={30}
            />
            <span className="text-3xl font-bold text-black font-Poppins">
              Elevate
            </span>
          </div>

          {/* Center: Homelessness Scout Link */}
          <div className="flex-1 text-center">
            <Link
              href="/"
              className="text-3xl font-bold text-[#9687EC] font-Poppins"
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
