import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterSidebar from "@/components/sidebar/FilterSidebar";
import CollegeList from "@/components/colleges/CollegeList";
import type { FilterValues } from "@/lib/types";
import { filterSchema } from "@/lib/types";
import { COURSES, ROUNDS, CATEGORIES } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecommendationsList from "@/components/colleges/RecommendationsList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [filters, setFilters] = useState<FilterValues>({
    course: COURSES[0],
    selectedBranches: [],
    round: ROUNDS[0],
    category: CATEGORIES[0],
    selectedCollegeTypes: [],
    maxFee: 500000,
    acpcRank: 1, // Default rank is 1 as specified
    selectedInstituteBranches: [],
    selectedInstitutes: []
  });

  const { data: colleges = [], isLoading: isLoadingColleges } = useQuery({
    queryKey: ["/api/colleges"]
  });

  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ["/api/branches"]
  });

  const handleFilterChange = (newFilters: Partial<FilterValues>) => {
    const merged = { ...filters, ...newFilters };
    const result = filterSchema.safeParse(merged);
    if (result.success) {
      setFilters(result.data);
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // toast({
    //   title: "File uploaded",
    //   description: "Processing your file to display college data...",
    // });
    
    // In a real implementation, you would upload these files to the server
    // For now we'll just show all existing colleges since we can't directly 
    // access Google Drive files from the client
  };



return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <FilterSidebar 
        filters={filters} 
        onFilterChange={handleFilterChange}
      />
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-6">College Recommendations</h2>
        
        <Tabs defaultValue="ml" className="mb-6">
          <TabsList>
            <TabsTrigger value="ml">ML Recommendations</TabsTrigger>
            <TabsTrigger value="all">All Colleges</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ml" className="mt-4">
            <RecommendationsList
              colleges={colleges}
              branches={branches}
              filters={filters}
              isLoading={isLoadingColleges || isLoadingBranches}
            />
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            <CollegeList 
              colleges={colleges}
              branches={branches}
              filters={filters}
              isLoading={isLoadingColleges || isLoadingBranches}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}