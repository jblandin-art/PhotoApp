"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/users");
  }, [router]);

  return <p className="ps-loading">Loading...</p>;
}