"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    axios
      .get("/api/me", { withCredentials: true })
      .then(() => {
        router.push("/users");
      })
      .catch(() => {
        router.push("/login-register");
      });
  }, [router]);

  return <p className="ps-loading">Loading...</p>;
}