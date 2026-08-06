import UserPhotosWrapper from "@/components/UserPhotosWrapper/UserPhotosWrapper";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <UserPhotosWrapper userId={userId} />;
}