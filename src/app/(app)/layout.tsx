import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppPresence } from "@/components/chat/app-presence";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppPresence />
      {children}
    </ProtectedRoute>
  );
}
