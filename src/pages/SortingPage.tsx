import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/admin/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { 
  LogOut, ArrowUpDown, Search, Filter, Sliders, X, Code, Briefcase, Eye 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScoringConfig {
  skillsWeight: number;
  experienceWeight: number;
  matchWeight: number;
  certificationBonus: number;
  referencesBonus: number;
  languagesWeight: number;
}

type SortCriteria = "experience" | "skills" | "rating" | "name" | "date" | "score" | "match" | "recent";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "pending" | "accepted" | "rejected";

interface CV {
  id: string;
  applicant_name: string;
  email?: string;
  avatar_url?: string;
  years_experience: number;
  skills: string[];
  current_job_title?: string;
  status: string;
  _score?: number;
  rating?: number; // Added the missing 'rating' property
  application_date: string;
  job_id?: string; // Added the missing 'job_id' property
  [key: string]: any;
}

const programmingLanguages = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Ruby", "Swift", 
  "Go", "Rust", "PHP", "Kotlin", "Dart", "R", "SQL", "HTML", "CSS", "Shell",
  "Scala", "Perl", "Haskell", "Lua"
];

const jobPositions = [
  "UI Designer", "UX Designer", "Frontend Developer", "Backend Developer", 
  "Full Stack Developer", "Project Manager", "Product Manager", "DevOps Engineer",
  "Data Scientist", "Machine Learning Engineer", "QA Engineer", "Mobile Developer",
  "System Administrator", "Database Administrator", "Game Developer", "Security Engineer",
  "Technical Writer", "IT Support Specialist", "Cloud Engineer", "Technical Lead",
  "Software Architect", "CTO", "IT Manager"
];

const SortingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [minExperience, setMinExperience] = useState<number>(0);
  const [maxExperience, setMaxExperience] = useState<number>(30);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedJobId, setSelectedJobId] = useState<string | "all">("all");

  // Sorting state
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("match");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Languages and positions filters
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  // Scoring configuration
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({
    skillsWeight: 2,
    experienceWeight: 5,
    matchWeight: 1,
    certificationBonus: 15,
    referencesBonus: 10,
    languagesWeight: 1
  });
  const [showScoringConfig, setShowScoringConfig] = useState<boolean>(false);

  // Fetch CVs from supabase
  const { data: cvs, isLoading, error } = useQuery({
    queryKey: ["cvs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cvs")
        .select("*, job_id") // Ensure job_id is included
        .order("application_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Helper functions
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const togglePosition = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setSelectedSkills([]);
    setSelectedLanguages([]);
    setSelectedPositions([]);
    setMinExperience(0);
    setMaxExperience(30);
    toast({
      title: "Filters cleared",
      description: "All filtering criteria have been reset."
    });
  };

  const resetScoringConfig = () => {
    setScoringConfig({
      skillsWeight: 2,
      experienceWeight: 5,
      matchWeight: 1,
      certificationBonus: 15,
      referencesBonus: 10,
      languagesWeight: 1
    });
    toast({
      title: "Scoring reset",
      description: "Scoring configuration has been reset to default values."
    });
  };

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: jobPostings, isLoading: jobsLoading } = useQuery({
    queryKey: ["job_postings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const saveScoringConfig = () => {
    toast({
      title: "Scoring configuration saved",
      description: "Your scoring preferences have been applied."
    });
    setShowScoringConfig(false);
  };

  // Filtering and scoring logic
  const matchesSearchQuery = (cv: CV): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (cv.applicant_name?.toLowerCase().includes(query)) return true;
    if (cv.skills?.some((skill: string) => skill.toLowerCase().includes(query))) return true;
    if (cv.current_job_title?.toLowerCase().includes(query)) return true;
    return false;
  };

  const hasSelectedLanguages = (cv: CV): boolean => {
    if (selectedLanguages.length === 0) return true;
    const hasInSkills = cv.skills?.some((skill: string) =>
      selectedLanguages.some(lang => skill.toLowerCase().includes(lang.toLowerCase()))
    );
    const hasInEducation = selectedLanguages.some(lang =>
      cv.education?.toLowerCase().includes(lang.toLowerCase())
    );
    const hasInExperience = selectedLanguages.some(lang =>
      cv.industry_experience?.toLowerCase().includes(lang.toLowerCase())
    );
    return hasInSkills || hasInEducation || hasInExperience;
  };

  const hasSelectedPositions = (cv: CV): boolean => {
    if (selectedPositions.length === 0) return true;
    const hasInTitle = selectedPositions.some(position =>
      cv.current_job_title?.toLowerCase().includes(position.toLowerCase())
    );
    const hasInExperience = selectedPositions.some(position =>
      cv.industry_experience?.toLowerCase().includes(position.toLowerCase())
    );
    const hasInGoals = selectedPositions.some(position =>
      cv.career_goals?.toLowerCase().includes(position.toLowerCase())
    );
    return hasInTitle || hasInExperience || hasInGoals;
  };

  const scoreCVs = (cvList: CV[]) => {
    return cvList.map(cv => {
      const skillsScore = (cv.skills?.length || 0) * scoringConfig.skillsWeight;
      const experienceScore = cv.years_experience * scoringConfig.experienceWeight;
      const matchScore = (cv.requirements_match || 0) * scoringConfig.matchWeight;
      const certificationBonus = cv.certifications ? scoringConfig.certificationBonus : 0;
      const referencesBonus = cv.references ? scoringConfig.referencesBonus : 0;
      const languagesScore = (cv.languages_known?.length || 0) * scoringConfig.languagesWeight;
      
      const totalScore = skillsScore + experienceScore + matchScore + 
                         certificationBonus + referencesBonus + languagesScore;
      
      return {
        ...cv,
        _score: totalScore
      };
    });
  };

  const filteredAndSortedCVs = useMemo(() => {
    if (!cvs) return [];
    const scoredCVs = scoreCVs(
      cvs.filter(cv => {
        if (statusFilter !== "all" && cv.status !== statusFilter) return false; // Filter by status
        if (selectedJobId !== "all" && cv.job_id !== selectedJobId) return false; // Filter by job posting
        if (!matchesSearchQuery(cv)) return false;
        if (cv.years_experience < minExperience || cv.years_experience > maxExperience) return false;
        if (selectedSkills.length > 0 && 
            !selectedSkills.every(skill =>
              cv.skills?.some((cvSkill: string) =>
                cvSkill.toLowerCase().includes(skill.toLowerCase())
              )
            )
        ) return false;
        if (!hasSelectedLanguages(cv)) return false;
        if (!hasSelectedPositions(cv)) return false;
        return true;
      })
    );
    return scoredCVs.sort((a, b) => {
      switch (sortCriteria) {
        case "experience":
          return sortOrder === "asc" 
            ? a.years_experience - b.years_experience
            : b.years_experience - a.years_experience;
        case "recent":
          return sortOrder === "asc"
            ? new Date(a.application_date).getTime() - new Date(b.application_date).getTime()
            : new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
        case "match":
        default:
          return sortOrder === "asc"
            ? a._score - b._score
            : b._score - a._score;
      }
    });
  }, [
    cvs, statusFilter, selectedJobId, searchQuery, minExperience, maxExperience,
    selectedSkills, selectedLanguages, selectedPositions,
    sortCriteria, sortOrder, scoringConfig
  ]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="bg-primary relative md:flex flex-col items-center justify-center p-8 min-h-screen">
        <Sidebar />
        <div className="ml-[88px] p-6 w-full flex items-center justify-center">
          <div className="text-xl">Loading CVs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary relative md:flex flex-col items-center justify-center p-8 min-h-screen">
        <Sidebar />
        <div className="ml-[88px] p-6 w-full flex items-center justify-center">
          <div className="text-xl text-red-500">Error: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary relative md:flex flex-col items-center justify-center p-8 min-h-screen">
      <Sidebar />
      <div className="ml-[88px] p-6 w-full">
        <div className="bg-secondary backdrop-blur rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">CV Sorting</h1>
            <Button variant="destructive" className="rounded-xl gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <Card className="mt-4 bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name, skills, or job title..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  
                  <Button
                    variant={showScoringConfig ? "default" : "outline"}
                    onClick={() => setShowScoringConfig(!showScoringConfig)}
                    className="gap-1"
                  >
                    <Sliders className="h-4 w-4" />
                    Scoring
                  </Button>
                  
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {showScoringConfig && (
                <div className="border rounded-lg p-4 mt-4 space-y-4 bg-white/30">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Scoring Configuration</h3>
                    <Button variant="outline" size="sm" onClick={resetScoringConfig}>
                      Reset to Default
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="skills-weight">Skills Weight</Label>
                          <span className="text-sm font-medium">{scoringConfig.skillsWeight}</span>
                        </div>
                        <Slider 
                          id="skills-weight"
                          min={0} 
                          max={10} 
                          step={1}
                          value={[scoringConfig.skillsWeight]} 
                          onValueChange={(value) =>
                            setScoringConfig(prev => ({ ...prev, skillsWeight: value[0] }))
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">Points per skill</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="exp-weight">Experience Weight</Label>
                          <span className="text-sm font-medium">{scoringConfig.experienceWeight}</span>
                        </div>
                        <Slider 
                          id="exp-weight"
                          min={0} 
                          max={10} 
                          step={1}
                          value={[scoringConfig.experienceWeight]} 
                          onValueChange={(value) =>
                            setScoringConfig(prev => ({ ...prev, experienceWeight: value[0] }))
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">Points per year of experience</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="match-weight">Requirements Match Weight</Label>
                          <span className="text-sm font-medium">{scoringConfig.matchWeight}</span>
                        </div>
                        <Slider 
                          id="match-weight"
                          min={0} 
                          max={5} 
                          step={0.5}
                          value={[scoringConfig.matchWeight]} 
                          onValueChange={(value) =>
                            setScoringConfig(prev => ({ ...prev, matchWeight: value[0] }))
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">Multiplier for requirements match</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="cert-bonus">Certification Bonus</Label>
                          <span className="text-sm font-medium">{scoringConfig.certificationBonus}</span>
                        </div>
                        <Slider 
                          id="cert-bonus"
                          min={0} 
                          max={50} 
                          step={5}
                          value={[scoringConfig.certificationBonus]} 
                          onValueChange={(value) =>
                            setScoringConfig(prev => ({ ...prev, certificationBonus: value[0] }))
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">Bonus points for certifications</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="ref-bonus">References Bonus</Label>
                          <span className="text-sm font-medium">{scoringConfig.referencesBonus}</span>
                        </div>
                        <Slider 
                          id="ref-bonus"
                          min={0} 
                          max={50} 
                          step={5}
                          value={[scoringConfig.referencesBonus]} 
                          onValueChange={(value) =>
                            setScoringConfig(prev => ({ ...prev, referencesBonus: value[0] }))
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">Bonus points for references</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="lang-weight">Languages Weight</Label>
                          <span className="text-sm font-medium">{scoringConfig.languagesWeight}</span>
                        </div>
                        <Slider 
                          id="lang-weight"
                          min={0} 
                          max={5} 
                          step={0.5}
                          value={[scoringConfig.languagesWeight]} 
                          onValueChange={(value) =>
                            setScoringConfig(prev => ({ ...prev, languagesWeight: value[0] }))
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">Points per language known</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={saveScoringConfig}>
                      Apply Scoring Configuration
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="text-sm">Sort by:</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={sortCriteria === "score" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSortCriteria("score");
                      setSortOrder(sortOrder === "desc" && sortCriteria === "score" ? "asc" : "desc");
                    }}
                  >
                    Match Score {sortCriteria === "score" && (sortOrder === "desc" ? "↓" : "↑")}
                  </Button>
                  
                  <Button
                    variant={sortCriteria === "experience" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSortCriteria("experience");
                      setSortOrder(sortOrder === "desc" && sortCriteria === "experience" ? "asc" : "desc");
                    }}
                  >
                    Experience {sortCriteria === "experience" && (sortOrder === "desc" ? "↓" : "↑")}
                  </Button>
                  
                  <Button
                    variant={sortCriteria === "name" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSortCriteria("name");
                      setSortOrder(sortOrder === "desc" && sortCriteria === "name" ? "asc" : "desc");
                    }}
                  >
                    Name {sortCriteria === "name" && (sortOrder === "desc" ? "↓" : "↑")}
                  </Button>
                  
                  <Button
                    variant={sortCriteria === "date" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSortCriteria("date");
                      setSortOrder(sortOrder === "desc" && sortCriteria === "date" ? "asc" : "desc");
                    }}
                  >
                    Date {sortCriteria === "date" && (sortOrder === "desc" ? "↓" : "↑")}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 mt-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium mb-2">Application Status</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all" />
                            <Label htmlFor="all">All</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pending" id="pending" />
                            <Label htmlFor="pending">Pending</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="accepted" id="accepted" />
                            <Label htmlFor="accepted">Accepted</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="rejected" id="rejected" />
                            <Label htmlFor="rejected">Rejected</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Experience Range</h4>
                    <div className="px-2">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>{minExperience} years</span>
                        <span>{maxExperience} years</span>
                      </div>
                      <Slider
                        defaultValue={[minExperience, maxExperience]}
                        max={30}
                        step={1}
                        onValueChange={(values) => {
                          setMinExperience(values[0]);
                          setMaxExperience(values[1]);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedSkills.map(skill => (
                        <Badge 
                          key={skill} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {["React", "JavaScript", "Python", "Node.js", "AWS", "SQL", "TypeScript", "Java"].map(skill => (
                        <Badge 
                          key={skill}
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4" />
                      <h4 className="font-medium">Programming Languages</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedLanguages.map(language => (
                        <Badge 
                          key={language} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleLanguage(language)}
                        >
                          {language}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {programmingLanguages.map(language => (
                        <div key={language} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`lang-${language}`}
                            checked={selectedLanguages.includes(language)}
                            onCheckedChange={() => toggleLanguage(language)}
                          />
                          <Label htmlFor={`lang-${language}`} className="truncate">
                            {language}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4" />
                      <h4 className="font-medium">Job Positions</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedPositions.map(position => (
                        <Badge 
                          key={position} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => togglePosition(position)}
                        >
                          {position}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {jobPositions.map(position => (
                        <div key={position} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`pos-${position}`}
                            checked={selectedPositions.includes(position)}
                            onCheckedChange={() => togglePosition(position)}
                          />
                          <Label htmlFor={`pos-${position}`} className="truncate">
                            {position}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(statusFilter !== "all" || searchQuery || selectedSkills.length > 0 || 
                selectedLanguages.length > 0 || selectedPositions.length > 0 || 
                minExperience > 0 || maxExperience < 30) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-muted-foreground mt-1">Active filters:</span>
                  {statusFilter !== "all" && (
                    <Badge variant="outline">
                      Status: {statusFilter}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="outline">
                      Search: {searchQuery}
                    </Badge>
                  )}
                  {(minExperience > 0 || maxExperience < 30) && (
                    <Badge variant="outline">
                      Experience: {minExperience} - {maxExperience} years
                    </Badge>
                  )}
                  {selectedSkills.length > 0 && (
                    <Badge variant="outline">
                      Skills: {selectedSkills.length} selected
                    </Badge>
                  )}
                  {selectedLanguages.length > 0 && (
                    <Badge variant="outline">
                      Languages: {selectedLanguages.length} selected
                    </Badge>
                  )}
                  {selectedPositions.length > 0 && (
                    <Badge variant="outline">
                      Positions: {selectedPositions.length} selected
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="mb-6">
          <Card className="space-y-6 bg-secondary rounded-xl p-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filter Applications</h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filters</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="job-filter" className="text-sm font-medium mb-1 block">
                    Job Position
                  </Label>
                  <Select
                    value={selectedJobId}
                    onValueChange={(value) => setSelectedJobId(value)}
                  >
                    <SelectTrigger id="job-filter">
                      <SelectValue placeholder="All Positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {jobPostings?.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status-filter" className="text-sm font-medium mb-1 block">
                    Application Status
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sort-by" className="text-sm font-medium mb-1 block">
                    Sort By
                  </Label>
                  <Select
                    value={sortCriteria}
                    onValueChange={(value) => setSortCriteria(value as SortCriteria)}
                  >
                    <SelectTrigger id="sort-by">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">Requirements Match</SelectItem>
                      <SelectItem value="experience">Years of Experience</SelectItem>
                      <SelectItem value="recent">Recent Applications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Table of CVs with the new pending toggle */}
        <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-lg">Applications</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Only show pending</span>
              <Switch
                checked={showOnlyPending}
                onCheckedChange={setShowOnlyPending}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCVs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No CVs match your current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedCVs
                  .filter(cv => !showOnlyPending || cv.status === "pending")
                  .map((cv) => (
                    <TableRow key={cv.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            {cv.avatar_url ? (
                              <AvatarImage src={cv.avatar_url} alt={cv.applicant_name} />
                            ) : (
                              <AvatarFallback>{cv.applicant_name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{cv.applicant_name}</p>
                            {cv.email && (
                              <p className="text-xs text-muted-foreground">{cv.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{cv.years_experience} years</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cv.skills?.slice(0, 3).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {cv.skills?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{cv.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{jobPostings?.find(job => job.id === cv.job_id)?.title || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cv.status === "accepted"
                              ? "default"
                              : cv.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {cv.status
                            ? cv.status.charAt(0).toUpperCase() + cv.status.slice(1)
                            : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {cv._score ? cv._score.toFixed(0) : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/cv/${cv.id}`)}
                          className="space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default SortingPage;