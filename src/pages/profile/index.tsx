import { useState, useEffect } from "react";
import Head from "next/head";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import { Role, User } from "@prisma/client";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ApiResponse } from "@/models/api-response";
import { AxiosError } from "axios";
// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, { message: "Nama harus lebih dari 2 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  position: z.string().min(2, { message: "Posisi harus diisi" }),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, { message: "Password saat ini harus diisi" }),
    newPassword: z
      .string()
      .min(6, { message: "Password baru minimal 6 karakter" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function ProfilePage() {
  const { updateProfile, updatePassword } = useAuth();
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(
    null
  );
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null
  );

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Initialize forms
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      position: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Load user data into form
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get<ApiResponse<User>>("/user/profile");
      if (response.data) {
        profileForm.reset({
          name: response.data.data.name,
          email: response.data.data.email,
          position: response.data.data.position,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Handler for updating profile
  const handleUpdateProfile = async (values: z.infer<typeof profileSchema>) => {
    setProfileUpdateLoading(true);
    setProfileUpdateError("");

    try {
      await updateProfile({
        name: values.name,
        email: values.email,
        position: values.position,
      });
      // Show success message via form UI
      setProfileUpdateError(null);
      setProfileSuccess("Profil berhasil diperbarui");
    } catch (error) {
      if (error instanceof AxiosError) {
        setProfileUpdateError(
          error.response?.data?.message || "Failed to update profile"
        );
      } else {
        setProfileUpdateError("Failed to update profile");
      }
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  // Handler for changing password
  const handleChangePassword = async (
    values: z.infer<typeof passwordSchema>
  ) => {
    setPasswordChangeLoading(true);
    setPasswordChangeError("");

    try {
      await updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      // Reset form on success
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess("Password berhasil diubah");
      setPasswordChangeError(null);
    } catch (error) {
      if (error instanceof AxiosError) {
        setPasswordChangeError(
          error.response?.data?.message || "Failed to change password"
        );
      } else {
        setPasswordChangeError("Failed to change password");
      }
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Edit Profil | {APP_NAME}</title>
      </Head>

      <div className="mb-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Edit Profil</CardTitle>
            <CardDescription>Perbarui informasi profil Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {profileUpdateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {profileUpdateError}
              </div>
            )}
            {profileSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                {profileSuccess}
              </div>
            )}

            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(handleUpdateProfile)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
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
                    control={profileForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posisi</FormLabel>
                        <FormControl>
                          <Input placeholder="Posisi Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={profileUpdateLoading}>
                  {profileUpdateLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Ubah Password</CardTitle>
            <CardDescription>Perbarui password akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordChangeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {passwordChangeError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                {passwordSuccess}
              </div>
            )}

            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Saat Ini</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Masukkan password saat ini"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password Baru</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Masukkan password baru"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Konfirmasi Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Konfirmasi password baru"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={passwordChangeLoading}>
                  {passwordChangeLoading
                    ? "Memperbarui..."
                    : "Perbarui Password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(ProfilePage, [Role.Admin, Role.User]);
