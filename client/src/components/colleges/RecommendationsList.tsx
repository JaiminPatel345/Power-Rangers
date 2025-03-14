import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, GraduationCap, Banknote, TrendingUp, Home, Award, InfoIcon, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { College, Branch } from "@shared/schema";
import type { FilterValues } from "@/lib/types";
import { getRankedRecommendations } from "@/lib/utils/mlPredictor";
import { useCompareStore } from "@/lib/stores/compareStore";


interface RecommendationsListProps {
  colleges: College[];
  branches: Branch[];
  filters: FilterValues;
  isLoading: boolean;
}

export default function RecommendationsList({ colleges, branches, filters, isLoading = false }: RecommendationsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recommendations, setRecommendations] = useState<{
    college: College;
    branch: Branch;
    chance: { chance: string; percentage: number };
  }[]>([]);

  const compareStore = useCompareStore();

  const { data: choices = [] } = useQuery({
    queryKey: ["/api/choices"]
  });

  // Calculate recommendations whenever inputs change
  useEffect(() => {
    if (!isLoading && filters.acpcRank && filters.acpcRank > 0) {
      const results = getRankedRecommendations(colleges, branches, filters);
      setRecommendations(results);
    } else {
      setRecommendations([]);
    }
  }, [colleges, branches, filters, isLoading]);

  const addToChoices = useMutation({
    mutationFn: async (data: { collegeId: number; branchId: number }) => {
      await apiRequest("POST", "/api/choices", {
        collegeId: data.collegeId,
        branchId: data.branchId,
        priority: 1 // Default priority
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/choices"] });
      const college = colleges.find(c => c.id === variables.collegeId);
      const branch = branches.find(b => b.id === variables.branchId);

      toast({
        title: "Added to choices",
        description: `${college?.name} - ${branch?.name} has been added to your choice list.`
      });
    }
  });

  const removeFromChoices = useMutation({
    mutationFn: async (choiceId: number) => {
      await apiRequest("DELETE", `/api/choices/${choiceId}`);
    },
    onSuccess: (_, choiceId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/choices"] });
      const choice = choices.find(c => c.id === choiceId);
      const college = colleges.find(c => c.id === choice?.collegeId);
      const branch = branches.find(b => b.id === choice?.branchId);

      toast({
        title: "Removed from choices",
        description: `${college?.name} - ${branch?.name} has been removed from your choice list.`
      });
    }
  });

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>
      ))}
    </div>;
  }

  // Safety check for missing data
  if (!colleges?.length || !branches?.length) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg">
        <p className="text-muted-foreground mb-2">No college data available</p>
        <p className="text-sm">Please upload college data files or try again later.</p>
      </div>
    );
  }

  if (!filters.acpcRank || filters.acpcRank <= 0) {
    return (
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Enter your ACPC rank</AlertTitle>
        <AlertDescription>
          Please enter your ACPC rank in the sidebar to get personalized college recommendations
          based on our machine learning algorithm.
        </AlertDescription>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>No matching recommendations</AlertTitle>
        <AlertDescription>
          We couldn't find any college recommendations that match your current filters.
          Try adjusting your filters or rank to see more options.
        </AlertDescription>
      </Alert>
    );
  }

  const chanceColors = {
    High: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-red-100 text-red-800"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Recommended Colleges</h2>
        <Button onClick={() => window.print()} className="flex gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      {recommendations.map((item, index) => {
        const { college, branch, chance } = item;
        const isInChoiceList = choices.some(
          choice => choice.collegeId === college.id && choice.branchId === branch.id
        );
        const choice = choices.find(
          c => c.collegeId === college.id && c.branchId === branch.id
        );
        const isInCompareList = compareStore.colleges.some(c => c.college.id === college.id && c.branch.id === branch.id);


        return (
          <Card key={`${college.id}-${branch.id}`} className="w-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="mr-2">#{index + 1}</Badge>
                    <h3 className="text-xl font-bold">{college.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    {college.city}
                    <Building2 className="h-4 w-4 ml-2" />
                    {college.type}
                  </div>
                </div>
                <div className="text-center">
                  <Badge className={`${chanceColors[chance.chance as keyof typeof chanceColors]} text-2xl px-6 py-3`}>
                    {chance.percentage}%
                  </Badge>
                  <p className="text-sm mt-1">Admission Chance</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-lg font-semibold">{branch.name}</p>
                    <p className="text-sm text-muted-foreground">{branch.course}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Placement Rate</p>
                      <p className="font-medium">{college.placementRate || "N/A"}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Package (LPA)</p>
                      <p className="font-medium">₹{college.averagePackage?.toLocaleString() || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Fee</p>
                      <p className="font-medium">₹{college.annualFee.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {!isInCompareList ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        compareStore.addCollege(college, branch);
                      }}
                    >
                      Compare
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        compareStore.removeCollege(college.id, branch.id);
                      }}
                    >
                      Remove from Compare
                    </Button>
                  )}
                  {!isInChoiceList ? (
                    <Button
                      onClick={() => {
                        addToChoices.mutate({
                          collegeId: college.id,
                          branchId: branch.id
                        });
                      }}
                    >
                      Add to Choices
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (choice) {
                          removeFromChoices.mutate(choice.id);
                        }
                      }}
                    >
                      Remove from Choices
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Admission Chance: {chance.chance} ({chance.percentage}%)
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}