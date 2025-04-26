import { useState, useEffect } from "react";
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

function EditUser() {
  const router = useRouter();
  const { id } = router.query;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      try {
        setIsFetching(true);
        const response = await api.get(`/admin/user/${id}`);
        const userData = response.data.data;

        // Set form values
        form.reset({
          name: userData.name,
          email: userData.email,
          staffNumber: userData.staffNumber,
          position: userData.position,
          role: userData.role,
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        if (err instanceof AxiosError) {
          setError(
            err.response?.data?.message || "Gagal mengambil data pengguna"
          );
        } else {
          setError("Gagal mengambil data pengguna");
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchUser();
  }, [id, form]);

  // Form submission handler
  const onSubmit = async (data: UserFormValues) => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.put(`/admin/user/${id}`, data);
      // Redirect to user detail page on success
      router.push(`/user/${id}`);
    } catch (err) {
      console.error("Error updating user:", err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Gagal memperbarui pengguna");
      } else {
        setError("Gagal memperbarui pengguna");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Edit Karyawan | {APP_NAME}</title>
      </Head>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Edit Karyawan</CardTitle>
            <CardDescription>Ubah data karyawan yang sudah ada</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {isFetching ? (
              <div className="py-10">
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-center mt-4 text-gray-500">
                  Memuat data karyawan...
                </p>
              </div>
            ) : (
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
                      onClick={() => router.push(`/user/${id}`)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(EditUser, [Role.Admin]);
