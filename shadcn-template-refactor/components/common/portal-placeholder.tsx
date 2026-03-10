import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";

interface PortalPlaceholderProps {
  title: string;
  description: string;
  eta?: string;
}

export function PortalPlaceholder({ title, description, eta }: PortalPlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader>
          <CardTitle>Work In Progress</CardTitle>
          <CardDescription>
            This section is scaffolded and ready for functional implementation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Next step is wiring API contracts and role-aware actions.
          </p>
          <Badge variant="outline">{eta ?? "Coming soon"}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
