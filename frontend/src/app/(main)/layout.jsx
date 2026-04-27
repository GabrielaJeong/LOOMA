import TabBar from "@/components/layout/TabBar";

export default function MainLayout({ children }) {
  return (
    <>
      <div className="min-h-[100dvh] pb-[96px]">{children}</div>
      <TabBar />
    </>
  );
}
