import { Skeleton } from "@/components/ui/skeleton";
import CollegeCard from "./CollegeCard";
import type { College, Branch, FilterValues } from "@/lib/types";
import { filterColleges } from "@/lib/utils/calculations";

interface CollegeListProps {
  colleges: College[];
  branches: Branch[];
  filters: FilterValues;
  isLoading: boolean;
}

export default function CollegeList({ 
  colleges, 
  branches,
  filters, 
  isLoading 
}: CollegeListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const filteredColleges = filterColleges(colleges, branches, filters);

  if (filteredColleges.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No colleges match your criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div>
      {filteredColleges.map(college => (
        branches
          .filter(branch => branch.collegeId === college.id)
          .map(branch => (
            <CollegeCard
              key={`${college.id}-${branch.id}`}
              college={college}
              branch={branch}
              filters={filters}
            />
          ))
      ))}
    </div>
  );
}