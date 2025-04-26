import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from '@/contexts/AuthContext';
import { Outfit } from "next/font/google";

// Configure Outfit font
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className={`${outfit.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}
