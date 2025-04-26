import { useRouter } from "next/router";
import { useEffect } from "react";

const Logout = () => {
  const router = useRouter();
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }, []);
  return null;
};

export default Logout;
