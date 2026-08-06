"use client";

import UserDetail from "@/components/userDetail/userDetail";

export default function UserDetailWrapper({
  userId,
}: {
  userId: string;
}) {
  return <UserDetail userId={userId} />;
}