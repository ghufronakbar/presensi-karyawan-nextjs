import { useState } from "react";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/constants/env";
import Link from "next/link";
import { AxiosError } from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // The redirect will be handled in the login function
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Gagal login. Silakan coba lagi."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal login. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | {APP_NAME}</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
              <CardDescription>
                Masuk ke akun Anda untuk melanjutkan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@perusahaan.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Memproses...
                      </div>
                    ) : (
                      "Masuk"
                    )}
                  </Button>
                  <div className="w-full h-[1px] bg-gray-200 rounded-full" />
                  <Link href="/qr-code" className="w-full">
                    <Button
                      variant="outline"
                      className="p-0 m-0 text-sm text-gray-600 hover:text-gray-800 w-full"
                    >
                      Presensi dengan QR Code
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-center text-sm text-gray-600">
              <p className="w-full">Sistem Presensi Karyawan {APP_NAME}</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
