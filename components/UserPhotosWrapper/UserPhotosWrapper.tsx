"use client";

import UserPhotos from "@/components/userPhotos/userPhotos";

export default function UserPhotosWrapper({
  userId,
}: {
  userId: string;
}) {
  return <UserPhotos userId={userId} />;
}