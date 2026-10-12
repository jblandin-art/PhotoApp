"use client";

import UserPhotos from "@/components/userPhotos/userPhotos";
import { useAuth } from "@/components/AuthContext";

export default function UserPhotosWrapper({
  userId,
}: {
  userId: string;
}) {
  const { loggedInUser } = useAuth();

  return <UserPhotos userId={userId} loggedInUser={loggedInUser} />;
}