import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { companyApi } from "../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../components/dashboard-ui";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ClipboardList, ChevronRight } from "lucide-react";

export default function TrainingsPage() {
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ["companyTrainings"],
    queryFn: () => companyApi.getMyTrainings(),
  });

  return (
    <div>
      <PageHeader
        title="Trainings"
        description="Formations assignées à votre entreprise"
      />

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
            Loading…
          </div>
        ) : trainings.length === 0 ? (
          <EmptyState
            title="Aucune formation assignée"
            description="Contactez votre administrateur Tynass pour assigner des formations."
          />
        ) : (
          <div className="divide-y divide-border/60">
            {trainings.map((t: any) => (
              <div key={t._id || t.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{t.title}</span>
                    {t.category && (
                      <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                    )}
                    <Badge variant={t.isActive !== false ? "default" : "secondary"} className="text-xs">
                      {t.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                    {t.hasQuiz ? (
                      <Badge className="text-xs bg-primary/20 text-primary border border-primary/30">
                        Quiz ✓
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        No Quiz
                      </Badge>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                  )}
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/trainings/${t._id || t.id}/quiz`}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Manage Quiz
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
