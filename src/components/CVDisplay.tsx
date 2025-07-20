import { Button } from "@/components/ui/button";
import {
  Edit,
  Upload,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Download,
} from "lucide-react";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CVDisplayProps {
  cv: {
    applicant_name: string;
    years_experience: number;
    skills: string[];
    status: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedin_profile?: string;
    github_profile?: string;
    portfolio_link?: string;
    current_job_title?: string;
    languages_known?: string[];
    education?: string;
    certifications?: string;
    references?: string;
    desired_salary?: string;
    willingness_to_relocate?: boolean;
    availability_for_remote_work?: boolean;
    industry_experience?: string;
    career_goals?: string;
    avatar_url?: string;
    theme?: string;
    theme_color?: string;
  };
  onEdit: () => void;
  isAdmin?: boolean;
  onThemeChange?: (theme: string) => void;
  onThemeColorChange?: (color: string) => void;
}

// Theme color palettes
const COLOR_PALETTES = {
  default: [
    { name: "Default Blue", value: "default" },
    { name: "Dark", value: "dark" },
    { name: "Blue", value: "blue" },
    { name: "Green", value: "green" },
    { name: "Purple", value: "purple" }
  ],
  minimal: [
    { name: "Gray", value: "gray" },
    { name: "Blue", value: "blue" },
    { name: "Green", value: "green" },
    { name: "Purple", value: "purple" },
    { name: "Red", value: "red" }
  ],
  elegant: [
    { name: "Blue", value: "blue" },
    { name: "Teal", value: "teal" },
    { name: "Purple", value: "purple" },
    { name: "Burgundy", value: "burgundy" },
    { name: "Forest", value: "forest" }
  ],
  creative: [
    { name: "Orange", value: "orange" },
    { name: "Pink", value: "pink" },
    { name: "Teal", value: "teal" },
    { name: "Purple", value: "purple" },
    { name: "Green", value: "green" }
  ]
};

const CVDisplay = ({ cv, onEdit, isAdmin = false, onThemeChange, onThemeColorChange }: CVDisplayProps) => {
  const cvRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!cvRef.current) return;

    const canvas = await html2canvas(cvRef.current, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for external images
      logging: false,
      backgroundColor: getThemeBackground(cv.theme || 'default'),
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${cv.applicant_name}-CV.pdf`);
  };

  const getThemeBackground = (theme: string): string => {
    const themeType = theme.split("-")[0] || "default";
    const themeColor = theme.split("-")[1] || "";

    switch (themeType) {
      case 'minimal':
        return getMinimalBackground(themeColor);
      case 'elegant':
        return getElegantBackground(themeColor);
      case 'creative':
        return getCreativeBackground(themeColor);
      default:
        return getDefaultBackground(themeColor);
    }
  };

  const getDefaultBackground = (color: string): string => {
    switch (color) {
      case 'dark': return '#1a1a1a';
      case 'blue': return '#f0f5ff';
      case 'green': return '#f0fff4';
      case 'purple': return '#f5f0ff';
      default: return '#ffffff';
    }
  };

  const getMinimalBackground = (color: string): string => {
    switch (color) {
      case 'blue': return '#f0f7ff';
      case 'green': return '#f0faf4';
      case 'purple': return '#f5f3ff';
      case 'red': return '#fff5f5';
      default: return '#ffffff'; // gray is default
    }
  };

  const getElegantBackground = (color: string): string => {
    switch (color) {
      case 'teal': return '#e6fffa';
      case 'purple': return '#f6f5ff';
      case 'burgundy': return '#fff5f7';
      case 'forest': return '#f0fff4';
      default: return '#f8f9fa'; // blue is default
    }
  };

  const getCreativeBackground = (color: string): string => {
    switch (color) {
      case 'pink': return '#fff0f6';
      case 'teal': return '#e6fffa';
      case 'purple': return '#f3f0ff';
      case 'green': return '#ebfbee';
      default: return '#fff8f0'; // orange is default
    }
  };

  const renderTheme = () => {
    const themeParts = (cv.theme || 'default').split('-');
    const themeType = themeParts[0];
    const themeColor = themeParts[1] || '';
    
    switch (themeType) {
      case 'minimal':
        return renderMinimalTheme(themeColor);
      case 'elegant':
        return renderElegantTheme(themeColor);
      case 'creative':
        return renderCreativeTheme(themeColor);
      default:
        return renderDefaultTheme(themeColor);
    }
  };

  const renderDefaultTheme = (themeColor: string) => {
    const themeClasses = getThemeClasses(themeColor);
    const headerClasses = getHeaderClasses(themeColor);
    const accentClasses = getAccentClasses(themeColor);
    const skillClasses = getSkillClasses(themeColor);

    return (
      <div className={`max-w-4xl mx-auto p-6 rounded-lg ${themeClasses}`}>
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          {cv.avatar_url ? (
            <img
              src={cv.avatar_url}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-primary"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center">
              <Upload className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="mt-4 md:mt-0 text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold">
              {cv.applicant_name}
            </h1>
            {cv.current_job_title && (
              <p className="text-xl text-muted-foreground mt-2">
                {cv.current_job_title}
              </p>
            )}
            {cv.industry_experience && (
              <p className="text-muted-foreground mt-1">{cv.industry_experience}</p>
            )}
            {/* Social Links */}
            <div className="flex justify-center md:justify-start space-x-4 mt-4">
              {cv.linkedin_profile && (
                <a
                  href={cv.linkedin_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:${accentClasses} transition-colors`}
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
              {cv.github_profile && (
                <a
                  href={cv.github_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:${accentClasses} transition-colors`}
                >
                  <Github className="w-6 h-6" />
                </a>
              )}
              {cv.portfolio_link && (
                <a
                  href={cv.portfolio_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:${accentClasses} transition-colors`}
                >
                  <Globe className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
          {/* Application Status */}
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
              Application Status
            </h2>
            <p
              className={`capitalize inline-block px-3 py-1 rounded-full text-sm font-medium ${
                cv.status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : cv.status === "rejected"
                  ? "bg-destructive/10 text-red-800"
                  : "bg-background text-red-400"
              }`}
            >
              {cv.status}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-border my-6"></div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                Contact Information
              </h2>
              <div className="space-y-2">
                {cv.email && (
                  <p className="flex items-center">
                    <Mail className={`w-5 h-5 mr-2 ${accentClasses}`} />
                    {cv.email}
                  </p>
                )}
                {cv.phone && (
                  <p className="flex items-center">
                    <Phone className={`w-5 h-5 mr-2 ${accentClasses}`} />
                    {cv.phone}
                  </p>
                )}
                {cv.address && (
                  <p className="flex items-center">
                    <MapPin className={`w-5 h-5 mr-2 ${accentClasses}`} />
                    {cv.address}
                  </p>
                )}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {cv.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`${skillClasses} px-3 py-1 rounded-full text-sm`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages Known */}
            {cv.languages_known && cv.languages_known.length > 0 && (
              <div>
                <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                  Languages Known
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cv.languages_known.map((language, index) => (
                    <span
                      key={index}
                      className={`${skillClasses} px-3 py-1 rounded-full text-sm`}
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cv.education && (
              <div>
                <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                  Education
                </h2>
                <p>{cv.education}</p>
              </div>
            )}

            {/* Certifications */}
            {cv.certifications && (
              <div>
                <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                  Certifications
                </h2>
                <p>{cv.certifications}</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Professional Experience */}
            <div>
              <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                Professional Experience
              </h2>
              <p>
                <span className="font-medium">Years of Experience:</span>{" "}
                {cv.years_experience} years
              </p>
              {cv.career_goals && (
                <p className="mt-2">{cv.career_goals}</p>
              )}
            </div>

            {/* Work Preferences */}
            <div>
              <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                Work Preferences
              </h2>
              <p>
                <span className="font-medium">Willing to Relocate:</span>{" "}
                {cv.willingness_to_relocate ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-medium">Available for Remote Work:</span>{" "}
                {cv.availability_for_remote_work ? "Yes" : "No"}
              </p>
            </div>

            {/* Desired Salary */}
            {cv.desired_salary && (
              <div>
                <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                  Desired Salary
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className={`${skillClasses} px-3 py-1 rounded-full text-sm`}>
                    {cv.desired_salary}
                  </span>
                </div>
              </div>
            )}

            {/* References */}
            {cv.references && (
              <div>
                <h2 className={`text-xl font-semibold ${accentClasses} mb-4`}>
                  References
                </h2>
                <p>{cv.references}</p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-6"></div>
      </div>
    );
  };

  const renderMinimalTheme = (themeColor: string = '') => {
    const accentColor = getMinimalAccentColor(themeColor);
    const bgColor = getMinimalBackground(themeColor);

    return (
      <div className={`max-w-4xl mx-auto p-8 rounded-lg shadow-sm`} style={{ backgroundColor: bgColor }}>
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-sans font-bold tracking-tight text-gray-900 mb-2">
            {cv.applicant_name}
          </h1>
          {cv.current_job_title && (
            <p className="text-lg text-gray-600 mb-4">{cv.current_job_title}</p>
          )}
          
          {/* Contact Row */}
          <div className="flex justify-center flex-wrap gap-4 text-sm text-gray-600">
            {cv.email && (
              <span className="flex items-center">
                <Mail className={`w-4 h-4 mr-1`} style={{ color: accentColor }} />
                {cv.email}
              </span>
            )}
            {cv.phone && (
              <span className="flex items-center">
                <Phone className={`w-4 h-4 mr-1`} style={{ color: accentColor }} />
                {cv.phone}
              </span>
            )}
            {cv.address && (
              <span className="flex items-center">
                <MapPin className={`w-4 h-4 mr-1`} style={{ color: accentColor }} />
                {cv.address}
              </span>
            )}
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-4 mt-4">
            {cv.linkedin_profile && (
              <a
                href={cv.linkedin_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
                style={{ color: accentColor }}
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {cv.github_profile && (
              <a
                href={cv.github_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
                style={{ color: accentColor }}
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {cv.portfolio_link && (
              <a
                href={cv.portfolio_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
                style={{ color: accentColor }}
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Experience */}
          <div>
            <h2 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-4" style={{ color: accentColor }}>
              Professional Experience
            </h2>
            <p className="mb-2">
              <span className="font-medium">Years of Experience:</span>{" "}
              {cv.years_experience} years
            </p>
            {cv.industry_experience && (
              <p className="mb-2">
                <span className="font-medium">Industry:</span> {cv.industry_experience}
              </p>
            )}
            {cv.career_goals && (
              <p className="text-gray-600 italic">{cv.career_goals}</p>
            )}
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-4" style={{ color: accentColor }}>
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {cv.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-md text-sm text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          {cv.languages_known && cv.languages_known.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4" style={{ color: accentColor }}>
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {cv.languages_known.map((language, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-md text-sm text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {cv.education && (
            <div>
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-4" style={{ color: accentColor }}>
                Education
              </h2>
              <p>{cv.education}</p>
            </div>
          )}

          {/* Certifications */}
          {cv.certifications && (
            <div>
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-4" style={{ color: accentColor }}>
                Certifications
              </h2>
              <p>{cv.certifications}</p>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <h3 className="text-md font-medium mb-2" style={{ color: accentColor }}>Work Preferences</h3>
              <p className="text-sm">
                <span className="font-medium">Willing to Relocate:</span>{" "}
                {cv.willingness_to_relocate ? "Yes" : "No"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Available for Remote Work:</span>{" "}
                {cv.availability_for_remote_work ? "Yes" : "No"}
              </p>
            </div>

            {cv.desired_salary && (
              <div>
                <h3 className="text-md font-medium mb-2" style={{ color: accentColor }}>Salary Expectation</h3>
                <p className="text-sm">{cv.desired_salary}</p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex justify-end mt-4">
            <span
              className={`capitalize inline-block px-3 py-1 rounded-full text-sm font-medium ${
                cv.status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : cv.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {cv.status}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderElegantTheme = (themeColor: string = '') => {
    const accentColor = getElegantAccentColor(themeColor);
    const bgColor = getElegantBackground(themeColor);
    const headerColor = getElegantHeaderColor(themeColor);

    return (
      <div className="max-w-4xl mx-auto p-10 rounded-lg shadow-md" style={{ backgroundColor: bgColor }}>
        {/* Header with avatar and name */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
          {cv.avatar_url ? (
            <img
              src={cv.avatar_url}
              alt="Profile"
              className="w-36 h-36 rounded-full object-cover border-4 shadow-md"
              style={{ borderColor: headerColor }}
            />
          ) : (
            <div className="w-36 h-36 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: headerColor }}>
              <Upload className="w-10 h-10 text-white" />
            </div>
          )}
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-sans font-bold tracking-tight mb-1" style={{ color: accentColor }}>
              {cv.applicant_name}
            </h1>
            
            {cv.current_job_title && (
              <p className="text-xl mb-4 font-light text-gray-600">
                {cv.current_job_title}
              </p>
            )}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-600">
              {cv.email && (
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" style={{ color: accentColor }} />
                  {cv.email}
                </span>
              )}
              {cv.phone && (
                <span className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" style={{ color: accentColor }} />
                  {cv.phone}
                </span>
              )}
              {cv.address && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" style={{ color: accentColor }} />
                  {cv.address}
                </span>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex justify-center md:justify-start space-x-4 mt-4">
              {cv.linkedin_profile && (
                <a
                  href={cv.linkedin_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: accentColor }}
                  className="hover:opacity-80 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {cv.github_profile && (
                <a
                  href={cv.github_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: accentColor }}
                  className="hover:opacity-80 transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {cv.portfolio_link && (
                <a
                  href={cv.portfolio_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: accentColor }}
                  className="hover:opacity-80 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          
          {/* Status */}
          <div className="mt-4 md:mt-0">
            <span
              className={`capitalize inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                cv.status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : cv.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {cv.status}
            </span>
          </div>
        </div>
        
        {/* Elegant divider */}
        <div className="relative h-px mb-10" style={{ background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)` }}>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rotate-45" 
            style={{ backgroundColor: bgColor, borderColor: accentColor, borderWidth: '1px' }}></div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Column - 1/3 */}
          <div className="space-y-8">
            {/* Skills */}
            <div>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {cv.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-md text-sm"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            {cv.languages_known && cv.languages_known.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                  style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cv.languages_known.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-md text-sm"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Work Preferences */}
            <div>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                Work Preferences
              </h2>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <span className={cv.willingness_to_relocate ? "text-green-600" : "text-red-600"}>●</span>
                  <span className="font-medium">Willing to Relocate:</span>{" "}
                  {cv.willingness_to_relocate ? "Yes" : "No"}
                </p>
                <p className="flex items-center gap-2">
                  <span className={cv.availability_for_remote_work ? "text-green-600" : "text-red-600"}>●</span>
                  <span className="font-medium">Remote Work:</span>{" "}
                  {cv.availability_for_remote_work ? "Yes" : "No"}
                </p>
              </div>
            </div>
            
            {/* Desired Salary */}
            {cv.desired_salary && (
              <div>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                  style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                  Salary Expectation
                </h2>
                <p className="font-mono font-semibold" style={{ color: accentColor }}>{cv.desired_salary}</p>
              </div>
            )}
          </div>
          
          {/* Right Column - 2/3 */}
          <div className="space-y-8 md:col-span-2">
            {/* Experience */}
            <div>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                Professional Experience
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: accentColor }} className="font-semibold">{cv.years_experience} Years Experience</span>
                  {cv.industry_experience && (
                    <span className="text-gray-500 text-sm">{cv.industry_experience}</span>
                  )}
                </div>
                {cv.career_goals && (
                  <div className="mt-2 p-4 bg-white rounded-md border-l-4 italic text-gray-600" style={{ borderColor: accentColor }}>
                    <p>{cv.career_goals}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Education */}
            {cv.education && (
              <div>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                  style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                  Education
                </h2>
                <p className="text-gray-700">{cv.education}</p>
              </div>
            )}
            
            {/* Certifications */}
            {cv.certifications && (
              <div>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                  style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                  Certifications
                </h2>
                <p className="text-gray-700">{cv.certifications}</p>
              </div>
            )}
            
            {/* References */}
            {cv.references && (
              <div>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4" 
                  style={{ color: accentColor, borderColor: `${accentColor}40` }}>
                  References
                </h2>
                <p className="text-gray-700 italic">{cv.references}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreativeTheme = (themeColor: string = '') => {
    const colors = getCreativeColors(themeColor);

    return (
      <div className="max-w-4xl mx-auto rounded-xl shadow-lg overflow-hidden" 
        style={{ background: `linear-gradient(to bottom right, ${colors.bgStart}, ${colors.bgEnd})` }}>
        {/* Header */}
        <div className="relative h-48 rounded-t-xl" 
          style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}>
          <div className="absolute -bottom-16 left-10">
            {cv.avatar_url ? (
              <img
                src={cv.avatar_url}
                alt="Profile"
                className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <Upload className="w-10 h-10" style={{ color: colors.primary }} />
              </div>
            )}
          </div>
          
          <div className="absolute bottom-4 right-8 left-56">
            <h1 className="text-3xl font-sans font-bold text-white">
              {cv.applicant_name}
            </h1>
            {cv.current_job_title && (
              <p className="text-white/80 text-lg">{cv.current_job_title}</p>
            )}
          </div>
        </div>
        
        {/* Status badge */}
        <div className="flex justify-end mt-4 mr-8">
          <span
            className={`capitalize inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
              cv.status === "accepted"
                ? "bg-green-100 text-green-800"
                : cv.status === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {cv.status}
          </span>
        </div>
        
        {/* Content */}
        <div className="p-8 pt-16">
          {/* Contact & Social Row */}
          <div className="flex flex-wrap justify-between items-center mb-10 p-4 bg-white/50 rounded-lg shadow-sm">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {cv.email && (
                <a href={`mailto:${cv.email}`} className="flex items-center hover:opacity-80 transition-colors" style={{ color: colors.primary }}>
                  <Mail className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                  {cv.email}
                </a>
              )}
              {cv.phone && (
                <a href={`tel:${cv.phone}`} className="flex items-center hover:opacity-80 transition-colors" style={{ color: colors.primary }}>
                  <Phone className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                  {cv.phone}
                </a>
              )}
              {cv.address && (
                <span className="flex items-center" style={{ color: colors.primary }}>
                  <MapPin className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                  {cv.address}
                </span>
              )}
            </div>
            
            <div className="flex space-x-3 mt-2 sm:mt-0">
              {cv.linkedin_profile && (
                <a
                  href={cv.linkedin_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-primary hover:text-white transition-all shadow-sm"
                  style={{ color: colors.primary }}
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {cv.github_profile && (
                <a
                  href={cv.github_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-primary hover:text-white transition-all shadow-sm"
                  style={{ color: colors.primary }}
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {cv.portfolio_link && (
                <a
                  href={cv.portfolio_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-primary hover:text-white transition-all shadow-sm"
                  style={{ color: colors.primary }}
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Left Column - 2/5 */}
            <div className="md:col-span-2 space-y-8">
              {/* Skills */}
              <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                  <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cv.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white border rounded-full text-sm"
                      style={{ color: colors.primary, borderColor: `${colors.primary}20` }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Languages */}
              {cv.languages_known && cv.languages_known.length > 0 && (
                <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                    <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                    Languages
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {cv.languages_known.map((language, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white border rounded-full text-sm"
                        style={{ color: colors.primary, borderColor: `${colors.primary}20` }}
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Work Preferences */}
              <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                  <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                  Work Preferences
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${cv.willingness_to_relocate ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className="font-medium">Relocation:</span>
                    <span className="ml-2">{cv.willingness_to_relocate ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${cv.availability_for_remote_work ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className="font-medium">Remote Work:</span>
                    <span className="ml-2">{cv.availability_for_remote_work ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
              
              {/* Desired Salary */}
              {cv.desired_salary && (
                <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                    <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                    Salary Expectation
                  </h2>
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.primary}10` }}>
                    <span className="text-lg font-mono font-semibold" style={{ color: colors.primary }}>{cv.desired_salary}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - 3/5 */}
            <div className="md:col-span-3 space-y-8">
              {/* Experience */}
              <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                  <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                  Professional Experience
                </h2>
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="px-4 py-2 text-white rounded-full" style={{ backgroundColor: colors.primary }}>
                      {cv.years_experience} Years Experience
                    </div>
                    {cv.industry_experience && (
                      <span className="text-gray-600 text-sm">{cv.industry_experience}</span>
                    )}
                  </div>
                  {cv.career_goals && (
                    <div className="mt-3 p-4 bg-white rounded-md border-l-4" style={{ borderColor: colors.primary }}>
                      <p className="text-gray-700">{cv.career_goals}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Education */}
              {cv.education && (
                <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                    <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                    Education
                  </h2>
                  <p className="text-gray-700">{cv.education}</p>
                </div>
              )}
              
              {/* Certifications */}
              {cv.certifications && (
                <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                    <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                    Certifications
                  </h2>
                  <p className="text-gray-700">{cv.certifications}</p>
                </div>
              )}
              
              {/* References */}
              {cv.references && (
                <div className="bg-white/60 p-5 rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.primary }}>
                    <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></span>
                    References
                  </h2>
                  <p className="text-gray-700 italic">{cv.references}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper functions for color schemes
  const getMinimalAccentColor = (color: string): string => {
    switch (color) {
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'purple': return '#8b5cf6';
      case 'red': return '#ef4444';
      default: return '#4b5563'; // gray (default)
    }
  };

  const getElegantAccentColor = (color: string): string => {
    switch (color) {
      case 'teal': return '#0d9488';
      case 'purple': return '#8b5cf6';
      case 'burgundy': return '#be185d';
      case 'forest': return '#166534';
      default: return '#3b82f6'; // blue (default)
    }
  };

  const getElegantHeaderColor = (color: string): string => {
    switch (color) {
      case 'teal': return '#99f6e4';
      case 'purple': return '#d8b4fe';
      case 'burgundy': return '#fbcfe8';
      case 'forest': return '#bbf7d0';
      default: return '#bfdbfe'; // blue (default)
    }
  };

  const getCreativeColors = (color: string): {primary: string, secondary: string, accent: string, bgStart: string, bgEnd: string} => {
    switch (color) {
      case 'pink':
        return {
          primary: '#ec4899',
          secondary: '#f472b6',
          accent: '#ec4899',
          bgStart: '#fff0f6',
          bgEnd: '#ffe4e6'
        };
      case 'teal':
        return {
          primary: '#14b8a6',
          secondary: '#2dd4bf',
          accent: '#14b8a6',
          bgStart: '#e6fffa',
          bgEnd: '#ccfbf1'
        };
      case 'purple':
        return {
          primary: '#8b5cf6',
          secondary: '#a78bfa',
          accent: '#8b5cf6',
          bgStart: '#f3f0ff',
          bgEnd: '#e9d5ff'
        };
      case 'green':
        return {
          primary: '#10b981',
          secondary: '#34d399',
          accent: '#10b981',
          bgStart: '#ebfbee',
          bgEnd: '#d1fae5'
        };
      default: // orange
        return {
          primary: '#f97316',
          secondary: '#fb923c',
          accent: '#f97316',
          bgStart: '#fff8f0',
          bgEnd: '#ffedd5'
        };
    }
  };

  const getThemeClasses = (theme: string): string => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-white shadow-xl';
      case 'blue':
        return 'bg-blue-50 text-blue-900 shadow-lg';
      case 'green':
        return 'bg-green-50 text-green-900 shadow-lg';
      case 'purple':
        return 'bg-purple-50 text-purple-900 shadow-lg';
      default:
        return 'bg-secondary shadow-lg';
    }
  };

  const getHeaderClasses = (theme: string): string => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 text-white';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  const getAccentClasses = (theme: string): string => {
    switch (theme) {
      case 'dark':
        return 'text-blue-400';
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-primary';
    }
  };

  const getButtonClasses = (theme: string): string => {
    switch (theme) {
      case 'dark':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'blue':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'green':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'purple':
        return 'bg-purple-500 text-white hover:bg-purple-600';
      default:
        return '';
    }
  };

  const getSkillClasses = (theme: string): string => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-700 text-white';
      case 'blue':
        return 'bg-blue-200 text-blue-800';
      case 'green':
        return 'bg-green-200 text-green-800';
      case 'purple':
        return 'bg-purple-200 text-purple-800';
      default:
        return 'bg-primary text-background';
    }
  };

  // Extract theme type and color
  const getThemeTypeAndColor = (themeValue: string): { type: string, color: string } => {
    const parts = themeValue.split('-');
    return {
      type: parts[0] || 'default',
      color: parts[1] || ''
    };
  };

  const { type: themeType, color: themeColor } = getThemeTypeAndColor(cv.theme || 'default');

  return (
    <div>
      {!isAdmin && onThemeChange && (
        <div className="mb-6">
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="color">Color</TabsTrigger>
            </TabsList>
            <TabsContent value="layout">
              <Select
                value={themeType}
                onValueChange={(value) => {
                  const newTheme = themeColor ? `${value}-${themeColor}` : value;
                  onThemeChange(newTheme);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="color">
              <Select
                value={themeColor || ''}
                onValueChange={(value) => {
                  const newTheme = value ? `${themeType}-${value}` : themeType;
                  onThemeChange(newTheme);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select color scheme" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_PALETTES[themeType as keyof typeof COLOR_PALETTES]?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <div ref={cvRef}>
        {renderTheme()}
      </div>

      {/* Actions */}
      <div className="flex justify-end mt-4 gap-3">
        <Button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>

        {!isAdmin && (
          <Button
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit CV
          </Button>
        )}
      </div>
    </div>
  );
};

export default CVDisplay;
