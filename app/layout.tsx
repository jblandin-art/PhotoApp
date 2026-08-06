import PhotoShareLayout from "@/components/PhotoShareLayout/PhotoShareLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PhotoShareLayout>
          {children}
        </PhotoShareLayout>
      </body>
    </html>
  );
}