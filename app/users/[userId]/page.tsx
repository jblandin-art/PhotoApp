import UserDetailWrapper from "@/components/UserDetailWrapper/UserDetailWrapper";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <UserDetailWrapper userId={userId} />;
}