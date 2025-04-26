import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import { Role } from "@prisma/client";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/config/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AxiosError } from "axios";

// Validation schema
const userSchema = z.object({
  name: z.string().min(2, { message: "Nama harus lebih dari 2 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  staffNumber: z
    .string()
    .length(8, { message: "Nomor staf harus 8 karakter" })
    .refine((val) => /^\S+$/.test(val), {
      message: "Nomor staf tidak boleh mengandung spasi",
    }),
  position: z.string().min(2, { message: "Posisi harus diisi" }),
  role: z.enum(["Admin", "User"]),
});

type UserFormValues = z.infer<typeof userSchema>;

function CreateUser() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      staffNumber: "",
      position: "",
      role: "User",
    },
  });

  // Form submission handler
  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/admin/user", data);
      // Redirect to user list page on success
      router.push("/user");
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Gagal membuat pengguna");
      } else {
        setError("Gagal membuat pengguna");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Tambah Karyawan | {APP_NAME}</title>
      </Head>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Tambah Karyawan</CardTitle>
            <CardDescription>
              Tambahkan data karyawan baru. Kata sandi akan dikirim ke email
              karyawan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan nama karyawan"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contoh@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="staffNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Staf</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678"
                          {...field}
                          maxLength={8}
                        />
                      </FormControl>
                      <FormDescription>
                        Nomor staf harus 8 karakter
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posisi</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan posisi karyawan"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          {...field}
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/user")}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(CreateUser, [Role.Admin]);
