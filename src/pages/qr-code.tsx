import { Button } from "@/components/ui/button";
import api from "@/config/api";
import { ApiResponse } from "@/models/api-response";
import { Information } from "@prisma/client";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { RefreshCw } from "lucide-react";

const QRCodePage = () => {
  const [qrCode, setQRCode] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchQRCode = async () => {
    setLoading(true);
    const res = await api.get<ApiResponse<Information>>("/qr-code");
    setQRCode(res.data.data.qrCode);
    setLoading(false);
  };
  useEffect(() => {
    fetchQRCode();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-t-4 border-b-4 border-gray-900 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <QRCode value={qrCode} />
          <p className="text-center text-sm text-gray-700">
            Scan me to get started
          </p>
          <Button variant="outline" className="w-fit" onClick={fetchQRCode}>
            Refresh <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default QRCodePage;
