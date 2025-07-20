
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type CV = Database["public"]["Tables"]["cvs"]["Row"];

interface TopPerformersProps {
  cvs: CV[];
}

interface ScoringConfig {
  skillsWeight: number;
  experienceWeight: number;
  matchWeight: number;
  certificationBonus: number;
  referencesBonus: number;
}

export const TopPerformers = ({ cvs }: TopPerformersProps) => {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(false);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({
    skillsWeight: 2,
    experienceWeight: 5,
    matchWeight: 1,
    certificationBonus: 15,
    referencesBonus: 10
  });

  const topPerformers = [...cvs]
    .map(cv => {
      const skillsScore = (cv.skills?.length || 0) * scoringConfig.skillsWeight;
      const experienceScore = cv.years_experience * scoringConfig.experienceWeight;
      const matchScore = (cv.requirements_match || 0) * scoringConfig.matchWeight;
      const certificationBonus = cv.certifications ? scoringConfig.certificationBonus : 0;
      const referencesBonus = cv.references ? scoringConfig.referencesBonus : 0;
      const totalScore = skillsScore + experienceScore + matchScore + certificationBonus + referencesBonus;
      return { ...cv, performanceScore: totalScore };
    })
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 5);

  return (
    <Card className="bg-secondary backdrop-blur border-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Outstanding candidates by skills, experience and match</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {showConfig ? "Hide" : "Config"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
          {showConfig && (
            <div className="mb-4 p-3 border rounded-md bg-white/30 space-y-3">
              <h4 className="font-medium text-sm">Scoring Configuration</h4>
              <Separator className="my-2" />
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label htmlFor="skills-weight" className="text-xs">Skills Weight</Label>
                  <span className="text-xs font-medium">{scoringConfig.skillsWeight}</span>
                </div>
                <Slider 
                  id="skills-weight"
                  min={0} 
                  max={10} 
                  step={1}
                  value={[scoringConfig.skillsWeight]} 
                  onValueChange={(value) => setScoringConfig(prev => ({ ...prev, skillsWeight: value[0] }))} 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label htmlFor="exp-weight" className="text-xs">Experience Weight</Label>
                  <span className="text-xs font-medium">{scoringConfig.experienceWeight}</span>
                </div>
                <Slider 
                  id="exp-weight"
                  min={0} 
                  max={10} 
                  step={1}
                  value={[scoringConfig.experienceWeight]} 
                  onValueChange={(value) => setScoringConfig(prev => ({ ...prev, experienceWeight: value[0] }))} 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label htmlFor="cert-bonus" className="text-xs">Certification Bonus</Label>
                  <span className="text-xs font-medium">{scoringConfig.certificationBonus}</span>
                </div>
                <Slider 
                  id="cert-bonus"
                  min={0} 
                  max={50} 
                  step={5}
                  value={[scoringConfig.certificationBonus]} 
                  onValueChange={(value) => setScoringConfig(prev => ({ ...prev, certificationBonus: value[0] }))} 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label htmlFor="ref-bonus" className="text-xs">References Bonus</Label>
                  <span className="text-xs font-medium">{scoringConfig.referencesBonus}</span>
                </div>
                <Slider 
                  id="ref-bonus"
                  min={0} 
                  max={50} 
                  step={5}
                  value={[scoringConfig.referencesBonus]} 
                  onValueChange={(value) => setScoringConfig(prev => ({ ...prev, referencesBonus: value[0] }))} 
                />
              </div>
            </div>
          )}
        
        <div className="space-y-4">
          {topPerformers.map((cv, index) => (
            <div key={index} className="flex items-center">
              <Avatar className="h-10 w-10 mr-4 bg-black text-white">
                {cv.avatar_url ? (
                  <AvatarImage src={cv.avatar_url} alt={cv.applicant_name} />
                ) : (
                  <AvatarFallback>{cv.applicant_name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="font-medium">{cv.applicant_name}</p>
                  <span className="ml-2 text-xs bg-black/10 px-2 py-0.5 rounded-full">
                    Score: {cv.performanceScore.toFixed(0)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm text-gray-500">
                    {cv.current_job_title || "Applicant"} • {cv.years_experience} yrs
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    • {cv.skills.length} skills
                  </span>
                  {cv.certifications && (
                    <span className="text-sm text-green-600 ml-1">• Certified</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => navigate(`/admin/cv/${cv.id}`)}
              >
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => navigate("/admin/applications")}
        >
          View all candidates
        </Button>
      </CardFooter>
    </Card>
  );
};
