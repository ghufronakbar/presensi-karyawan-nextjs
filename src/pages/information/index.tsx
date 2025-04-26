import Head from "next/head";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import { Information, Role } from "@prisma/client";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/config/api";
import { ApiResponse } from "@/models/api-response";
import QRCode from "react-qr-code";

function InformationManagement() {
  const [information, setInformation] = useState<Information | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    dismissalTime: "",
    maxWorkLeave: 0,
    maxSickLeave: 0,
  });

  useEffect(() => {
    const fetchInformation = async () => {
      try {
        const response = await api.get<ApiResponse<Information>>(
          "/admin/information"
        );
        setInformation(response.data.data);

        setFormData({
          startTime: response.data.data.startTime,
          endTime: response.data.data.endTime,
          dismissalTime: response.data.data.dismissalTime,
          maxWorkLeave: response.data.data.maxWorkLeave,
          maxSickLeave: response.data.data.maxSickLeave,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching information:", error);
        setLoading(false);
      }
    };

    fetchInformation();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "maxWorkLeave" || name === "maxSickLeave"
          ? parseInt(value)
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.post<ApiResponse<Information>>(
        "/admin/information",
        formData
      );
      setInformation(response.data.data);

      setSaving(false);
      alert("Informasi berhasil disimpan");
    } catch (error) {
      console.error("Error updating information:", error);
      setSaving(false);
      alert("Gagal menyimpan informasi");
    }
  };

  const [loadingQrCode, setLoadingQrCode] = useState(false);

  const generateNewQrCode = async () => {
    setLoadingQrCode(true);
    try {
      const response = await api.patch<ApiResponse<Information>>(
        "/admin/information"
      );
      setInformation(response.data.data);
      alert("QR Code berhasil dibuat");
    } catch (error) {
      console.error("Error generating new QR code:", error);
      alert("Gagal membuat QR Code baru");
    } finally {
      setLoadingQrCode(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <Head>
        <title>Pengaturan Informasi | {APP_NAME}</title>
      </Head>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Pengaturan Presensi
            </CardTitle>
            <CardDescription>
              Konfigurasi jadwal dan ketentuan presensi karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10">
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-center mt-4 text-gray-500">
                  Memuat informasi...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Jam Mulai Presensi</Label>
                          <Input
                            id="startTime"
                            name="startTime"
                            type="time"
                            value={formData.startTime}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">Batas Akhir Presensi</Label>
                          <Input
                            id="endTime"
                            name="endTime"
                            type="time"
                            value={formData.endTime}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dismissalTime">Jam Pulang</Label>
                        <Input
                          id="dismissalTime"
                          name="dismissalTime"
                          type="time"
                          value={formData.dismissalTime}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxWorkLeave">
                            Maks. Cuti Tahunan
                          </Label>
                          <Input
                            id="maxWorkLeave"
                            name="maxWorkLeave"
                            type="number"
                            min="0"
                            value={formData.maxWorkLeave}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxSickLeave">Maks. Cuti Sakit</Label>
                          <Input
                            id="maxSickLeave"
                            name="maxSickLeave"
                            type="number"
                            min="0"
                            value={formData.maxSickLeave}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={saving}
                        >
                          {saving ? (
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
                              Menyimpan...
                            </div>
                          ) : (
                            "Simpan Perubahan"
                          )}
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        {information && (
                          <p>
                            Terakhir diperbarui:{" "}
                            {formatDate(information?.updatedAt?.toString())}
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
                <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-md">
                  <h3 className="text-lg font-medium mb-4">QR Code Presensi</h3>
                  {information && (
                    <div className="text-center">
                      <div className="mb-4 border p-2 inline-block bg-white">
                        <QRCode
                          value={information.qrCode}
                          className="w-40 h-40"
                        />
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          onClick={generateNewQrCode}
                          className="w-full"
                        >
                          {loadingQrCode ? (
                            <div className="flex items-center justify-center">
                              <div className="w-4 h-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            "Generate QR Code Baru"
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          QR Code akan berubah setiap kali di-generate
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(InformationManagement, [Role.Admin]);
