import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/lib/stores/compareStore";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ComparisonView() {
  const [searchTerm, setSearchTerm] = useState("");
  const compareStore = useCompareStore();
  const selectedCards = compareStore.colleges;

  const { data: colleges = [] } = useQuery({
    queryKey: ["/api/colleges"]
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"]
  });

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const compareFields = [
    { label: "Branch", key: "branch.name" },
    { label: "Location", key: "college.city" },
    { label: "Placement Rate", key: "college.placementRate", format: (val: number) => `${val}%` },
    { label: "Average Package", key: "college.averagePackage", format: (val: number) => `₹${(val/100000).toFixed(1)}L` },
    { label: "Annual Fee", key: "college.annualFee", format: (val: number) => `₹${val.toLocaleString()}` },
    { label: "Type", key: "college.type" },
  ];

  const getValue = (item: any, path: string) => {
    const parts = path.split('.');
    let value = item;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">College Comparison</h2>
        {selectedCards.length < 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a college or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        )}
      </div>

      {selectedCards.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Add colleges to compare them side by side
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="p-4 text-left">Comparison Fields</th>
                {selectedCards.map((card, idx) => (
                  <th key={idx} className="p-4 text-center border-l relative">
                    <div className="font-bold">{card.college.name}</div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSelectedCards(cards => cards.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 h-6 w-6"
                    >
                      ✕
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map((field, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                  <td className="p-4 font-medium">{field.label}</td>
                  {selectedCards.map((card, cardIdx) => (
                    <td key={cardIdx} className="p-4 text-center border-l">
                      {field.format 
                        ? field.format(getValue({ college: card.college, branch: card.branch }, field.key))
                        : getValue({ college: card.college, branch: card.branch }, field.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {searchTerm && selectedCards.length < 3 && (
        <div className="mt-4 space-y-2">
          {filteredColleges.map(college => (
            <div key={college.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{college.name}</h3>
              <div className="mt-2 space-y-1">
                {branches
                  .filter(b => b.collegeId === college.id)
                  .map(branch => (
                    <div key={branch.id} className="flex justify-between items-center">
                      <span>{branch.name}</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCards(cards => [...cards, { college, branch }]);
                          setSearchTerm("");
                        }}
                      >
                        Add to Compare
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}