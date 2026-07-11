import PublicOnboarding from "@/components/PublicOnboarding";

export default async function ShareIdPage({ params }: { params: Promise<{ shareId: string }> }) {
  const resolvedParams = await params;
  return <PublicOnboarding urlTrekShareId={resolvedParams.shareId} />;
}
