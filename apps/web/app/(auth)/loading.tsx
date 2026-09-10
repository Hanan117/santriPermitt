import { Spinner } from "@/components/ui/spinner";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true" aria-label="Memuat halaman">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}
