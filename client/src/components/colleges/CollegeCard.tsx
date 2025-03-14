import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, GraduationCap, Banknote, TrendingUp, Home, Award } from "lucide-react";
import type { College, Branch } from "@shared/schema";
import type { FilterValues } from "@/lib/types";
import { calculateAdmissionChance } from "@/lib/utils/calculations";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CollegeCardProps {
  college: College;
  branch: Branch;
  filters: FilterValues;
}

export default function CollegeCard({ college, branch, filters }: CollegeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: choices = [] } = useQuery({
    queryKey: ["/api/choices"]
  });

  const isInChoiceList = choices.some(
    choice => choice.collegeId === college.id && choice.branchId === branch.id
  );

  const addToChoices = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/choices", {
        collegeId: college.id,
        branchId: branch.id,
        priority: 1 // Default priority
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/choices"] });
      toast({
        title: "Added to choices",
        description: `${college.name} - ${branch.name} has been added to your choice list.`
      });
    }
  });

  const removeFromChoices = useMutation({
    mutationFn: async () => {
      const choice = choices.find(
        c => c.collegeId === college.id && c.branchId === branch.id
      );
      if (choice) {
        await apiRequest("DELETE", `/api/choices/${choice.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/choices"] });
      toast({
        title: "Removed from choices",
        description: `${college.name} - ${branch.name} has been removed from your choice list.`
      });
    }
  });

  const { chance, percentage } = calculateAdmissionChance(college, branch.name, filters);
  const chanceColors = {
    High: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-red-100 text-red-800"
  };

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">{college.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {college.city}
              <Building2 className="h-4 w-4 ml-2" />
              {college.type}
            </div>
          </div>
          <div className="text-center">
            <Badge className={`${chanceColors[chance]} text-2xl px-6 py-3`}>
              {percentage}%
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-base">
                  {college.placementRate}%
                </p>
                <p className="text-sm text-muted-foreground">Placement Rate</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-base">
                  {college.averagePackage 
                    ? `₹${(college.averagePackage/100000).toFixed(1)}L`
                    : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Average Package</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">₹{college.annualFee.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Annual Fee</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Available</p>
                <p className="text-xs text-muted-foreground">Hostel Facility</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: Implement comparison view
            }}
          >
            Compare
          </Button>
          <Button
            variant={isInChoiceList ? "destructive" : "default"}
            onClick={() => {
              if (isInChoiceList) {
                removeFromChoices.mutate();
              } else {
                addToChoices.mutate();
              }
            }}
            disabled={addToChoices.isPending || removeFromChoices.isPending}
          >
            {isInChoiceList ? "Remove from Choices" : "Add to Choices"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}