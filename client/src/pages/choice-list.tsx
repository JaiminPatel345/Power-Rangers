import { useQuery } from "@tanstack/react-query";
import { type College, type Branch, type Choice } from "@shared/schema";
import CollegeCard from "@/components/colleges/CollegeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { COURSES, COLLEGE_TYPES } from "@/lib/constants";

export default function ChoiceList() {
  const { data: colleges = [] } = useQuery<College[]>({
    queryKey: ["/api/colleges"]
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"]
  });

  const { data: choices = [], isLoading } = useQuery<Choice[]>({
    queryKey: ["/api/choices"]
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-6">Your Choice List</h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Choice List</h2>
      {choices.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          You haven't added any colleges to your choice list yet.
        </p>
      ) : (
        <div className="space-y-4">
          {choices.map(choice => {
            const college = colleges.find(c => c.id === choice.collegeId);
            const branch = branches.find(b => b.id === choice.branchId);

            if (!college || !branch) return null;

            return (
              <CollegeCard
                key={choice.id}
                college={college}
                branch={branch}
                filters={{
                  course: COURSES[0],
                  branches: [],
                  round: "Mock",
                  category: "General",
                  collegeTypes: [college.type as typeof COLLEGE_TYPES[number]],
                  maxFee: college.annualFee,
                  acpcRank: undefined,
                  selectedInstituteBranch: undefined,
                  selectedInstitute: undefined
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}