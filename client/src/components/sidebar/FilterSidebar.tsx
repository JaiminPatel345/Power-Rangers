import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiCombobox, type ComboboxItem } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COURSES,
  CATEGORIES,
  COLLEGE_TYPES,
  ROUNDS,
  BRANCHES
} from "@/lib/constants";
import type { FilterValues } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { College, Branch } from "@/lib/types";

interface FilterSidebarProps {
  filters: FilterValues;
  onFilterChange: (filters: Partial<FilterValues>) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  // Get data from API
  const { data: colleges = [] } = useQuery<College[]>({
    queryKey: ["/api/colleges"]
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"]
  });

  // Get minimum cutoff rank for each college
  const collegeMinCutoffs = new Map<number, number>();
  colleges.forEach(college => {
    const collegeBranches = branches.filter(b => b.collegeId === college.id);
    const minCutoff = Math.min(...collegeBranches.map(b => b.cutoffRank || Infinity));
    collegeMinCutoffs.set(college.id, minCutoff);
  });

  // Sort colleges by minimum cutoff rank
  const sortedColleges = [...colleges].sort((a, b) => {
    const aCutoff = collegeMinCutoffs.get(a.id) || Infinity;
    const bCutoff = collegeMinCutoffs.get(b.id) || Infinity;
    return aCutoff - bCutoff;
  });

  // Create institute-branch combinations
  const instituteBranchOptions: ComboboxItem[] = sortedColleges.flatMap(college =>
    branches
      .filter(b => b.collegeId === college.id)
      .sort((a, b) => (a.cutoffRank || Infinity) - (b.cutoffRank || Infinity))
      .map(branch => ({
        value: `${college.id}-${branch.id}`,
        label: `${college.name} - ${branch.name}`
      }))
  );

  // Create institute-only options
  const instituteOptions: ComboboxItem[] = sortedColleges.map(college => ({
    value: college.id.toString(),
    label: college.name
  }));

  // Get available branches based on selected course
  const availableBranches = branches
    .filter(b => b.course === filters.course)
    .map(b => b.name)
    .filter((name, index, self) => self.indexOf(name) === index) // Unique values
    .sort();

  return (
    <aside className="w-80 border-r bg-card p-6 space-y-6">
      <h3 className="font-semibold text-lg">Your Details</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>ACPC Rank</Label>
          <Input
            type="number"
            value={filters.acpcRank || ""}
            onChange={(e) => onFilterChange({ acpcRank: parseInt(e.target.value) || undefined })}
            placeholder="Enter your rank"
          />
        </div>

        <div className="space-y-2">
          <Label>Institute and Branch</Label>
          <MultiCombobox
            placeholder="Select institutes and branches"
            emptyText="No matching institutes found"
            items={instituteBranchOptions}
            selected={filters.selectedInstituteBranches}
            onChange={(values) => onFilterChange({ selectedInstituteBranches: values })}
            searchPlaceholder="Search institutes and branches..."
          />
        </div>

        <div className="space-y-2">
          <Label>Institute</Label>
          <MultiCombobox
            placeholder="Select institutes"
            emptyText="No matching institutes found"
            items={instituteOptions}
            selected={filters.selectedInstitutes}
            onChange={(values) => onFilterChange({ selectedInstitutes: values })}
            searchPlaceholder="Search institutes..."
          />
        </div>

        <div className="space-y-2">
          <Label>Course</Label>
          <Select
            value={filters.course}
            onValueChange={(value: typeof COURSES[number]) => onFilterChange({
              course: value,
              selectedBranches: [] // Reset branches when course changes
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {COURSES.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Branches</Label>
          <MultiCombobox
            placeholder="Select branches"
            emptyText="No branches available for selected course"
            items={availableBranches.map(branch => ({ value: branch, label: branch }))}
            selected={filters.selectedBranches}
            onChange={(values) => onFilterChange({ selectedBranches: values as typeof BRANCHES[] })}
            searchPlaceholder="Search branches..."
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.category}
            onValueChange={(value: typeof CATEGORIES[number]) => onFilterChange({ category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Round</Label>
          <Select
            value={filters.round}
            onValueChange={(value: typeof ROUNDS[number]) => onFilterChange({ round: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select round" />
            </SelectTrigger>
            <SelectContent>
              {ROUNDS.map((round) => (
                <SelectItem key={round} value={round}>
                  Round {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Maximum Annual Fee</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[filters.maxFee]}
              min={0}
              max={1000000}
              step={10000}
              onValueChange={([value]) => onFilterChange({ maxFee: value })}
            />
            <span className="text-sm">
              ₹{filters.maxFee.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>College Type</Label>
          <div className="space-y-2">
            {COLLEGE_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={filters.selectedCollegeTypes.includes(type)}
                  onCheckedChange={(checked) => {
                    const types = checked
                      ? [...filters.selectedCollegeTypes, type]
                      : filters.selectedCollegeTypes.filter(t => t !== type);
                    onFilterChange({ selectedCollegeTypes: types });
                  }}
                />
                <label htmlFor={type} className="text-sm">{type}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}