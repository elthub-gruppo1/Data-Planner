import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <ShieldAlert className="h-12 w-12 text-primary mb-4 opacity-60" />
          <h1 className="text-2xl font-bold font-mono tracking-wider">ERROR 404</h1>
          <p className="mt-2 text-xs text-muted-foreground font-mono tracking-wider uppercase">
            Sector not found // Navigation required
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
