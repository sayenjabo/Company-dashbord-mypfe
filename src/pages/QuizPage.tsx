import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../components/dashboard-ui";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Check, Save } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";

const emptyQuestion = () => ({
  text: "",
  choices: [{ text: "" }, { text: "" }, { text: "" }],
  correctIndex: 0,
});

export default function QuizPage() {
  const { trainingId } = useParams();
  const qc = useQueryClient();

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", trainingId],
    queryFn: () => companyApi.getQuiz(trainingId || ""),
    retry: false,
    enabled: !!trainingId,
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ["companyTrainings"],
    queryFn: () => companyApi.getMyTrainings(),
  });

  const training = trainings.find((t: any) => (t._id || t.id) === trainingId);
  const quizData = quiz?.quiz ?? quiz;
  const hasQuiz = !!quizData?.questions && !quizLoading;  

  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [passingScore, setPassingScore] = useState(70);
  const [isActive, setIsActive] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
  if (quiz && !initialized) {
    const quizData = quiz.quiz ?? quiz;
    setQuestions(quizData.questions ?? [emptyQuestion()]);
    setPassingScore(quizData.passingScore ?? 70);
    setIsActive(quizData.isActive !== false);
    setInitialized(true);
  }
}, [quiz, initialized]);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = { questions, passingScore, isActive };
      return hasQuiz
        ? companyApi.updateQuiz(trainingId || "", payload)
        : companyApi.createQuiz(trainingId || "", payload);
    },
   onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["quiz", trainingId] });
  qc.invalidateQueries({ queryKey: ["companyTrainings"] });
  toast.success(hasQuiz ? "Quiz updated" : "Quiz created");
  },
    onError: (e: any) => toast.error(e.message || "Failed to save quiz"),
  });

  const deleteMut = useMutation({
    mutationFn: () => companyApi.deleteQuiz(trainingId || ""),
    onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["quiz", trainingId] });
  qc.invalidateQueries({ queryKey: ["companyTrainings"] });
  setQuestions([emptyQuestion()]);
  setPassingScore(70);
  setIsActive(true);
  setDeleteOpen(false);
  toast.success("Quiz deleted");
},
    onError: (e: any) => toast.error(e.message || "Failed to delete quiz"),
  });

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const removeQuestion = (qi: number) =>
    setQuestions(questions.filter((_, i) => i !== qi));

  const updateQuestionText = (qi: number, text: string) =>
    setQuestions(questions.map((q, i) => i === qi ? { ...q, text } : q));

  const setCorrectIndex = (qi: number, ci: number) =>
    setQuestions(questions.map((q, i) => i === qi ? { ...q, correctIndex: ci } : q));

  const updateChoice = (qi: number, ci: number, text: string) =>
    setQuestions(questions.map((q, i) =>
      i === qi
        ? { ...q, choices: q.choices.map((c, j) => j === ci ? { text } : c) }
        : q
    ));

  const addChoice = (qi: number) =>
    setQuestions(questions.map((q, i) =>
      i === qi ? { ...q, choices: [...q.choices, { text: "" }] } : q
    ));

  const removeChoice = (qi: number, ci: number) =>
    setQuestions(questions.map((q, i) => {
      if (i !== qi) return q;
      const newChoices = q.choices.filter((_, j) => j !== ci);
      const newCorrect = q.correctIndex === ci ? 0
        : q.correctIndex > ci ? q.correctIndex - 1
        : q.correctIndex;
      return { ...q, choices: newChoices, correctIndex: newCorrect };
    }));

  if (quizLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Loading quiz…</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/trainings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trainings
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Quiz — ${training?.title || "Formation"}`}
        description={hasQuiz
          ? `${quizData.questions?.length || 0} questions · Passing score : ${quizData.passingScore}%`
          : "Aucun quiz pour cette formation"
        }
        actions={
          <div className="flex gap-2">
            {hasQuiz && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Quiz
              </Button>
            )}
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMut.isPending ? "Saving…" : hasQuiz ? "Save Changes" : "Create Quiz"}
            </Button>
          </div>
        }
      />

      {/* Settings */}
      <GlassCard className="mb-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-2">
            <Label>Passing Score (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Score minimum pour valider</p>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center gap-3 h-10">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <GlassCard key={qi}>
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-muted-foreground mt-3 w-5 text-center shrink-0">
                {qi + 1}
              </span>

              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={q.text}
                    onChange={(e) => updateQuestionText(qi, e.target.value)}
                    placeholder="Ex : Que faire en cas d'incendie ?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Choix de réponse</Label>
                  <div className="space-y-2">
                    {q.choices.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <button
                          onClick={() => setCorrectIndex(qi, ci)}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            q.correctIndex === ci
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50 text-transparent"
                          }`}
                          title="Bonne réponse"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <Input
                          value={c.text}
                          onChange={(e) => updateChoice(qi, ci, e.target.value)}
                          placeholder={`Choix ${ci + 1}`}
                          className={q.correctIndex === ci ? "border-primary/50 bg-primary/5" : ""}
                        />
                        {q.choices.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeChoice(qi, ci)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.choices.length < 4 && (
                    <Button variant="ghost" size="sm" onClick={() => addChoice(qi)} className="text-muted-foreground">
                      <Plus className="h-3 w-3 mr-1" /> Add choice
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Cliquez sur le cercle pour marquer la bonne réponse ·
                    <span className="text-primary ml-1">
                      Bonne réponse : {q.choices[q.correctIndex]?.text || "non définie"}
                    </span>
                  </p>
                </div>
              </div>

              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive mt-2"
                  onClick={() => removeQuestion(qi)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </GlassCard>
        ))}

        <Button variant="outline" onClick={addQuestion} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Add Question
        </Button>
      </div>

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMut.isPending ? "Saving…" : hasQuiz ? "Save Changes" : "Create Quiz"}
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le quiz ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le quiz de "{training?.title}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
