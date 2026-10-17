/**
 * Core business logic and scoring algorithms for Smart Local
 */

export interface JobItem {
  id: number;
  recruiterId?: number;
  recruiterName?: string;
  companyName: string;
  title: string;
  description: string;
  responsibilities?: string;
  qualifications?: string;
  category: string;
  skills: string[];
  jobType: 'internship' | 'part-time' | 'freelance' | 'remote' | 'project' | 'full-time';
  workArrangement: 'on-site' | 'remote' | 'hybrid';
  city: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  salaryMin: number;
  salaryMax: number;
  stipendType: 'fixed' | 'range' | 'unpaid' | 'performance';
  duration?: string;
  openings: number;
  deadline?: string;
  source: string;
  externalUrl?: string;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  isFeatured: boolean;
  isVerified: boolean;
  viewsCount: number;
  createdAt: string;
}

export interface StudentProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  city: string;
  locality?: string;
  college?: string;
  course?: string;
  graduationYear?: number;
  skills: string[];
  latitude?: number;
  longitude?: number;
  bio?: string;
}

export const SKILL_CATALOG = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'SQL', 'MySQL', 'PostgreSQL',
  'PHP', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Git', 'GitHub', 'C++', 'Java',
  'Docker', 'AWS', 'FastAPI', 'Django', 'Figma', 'UI Design', 'UX Research', 'Excel',
  'Power BI', 'Machine Learning', 'Data Analysis', 'Arduino', 'IoT', 'ESP32', 'MQTT',
  'Content Writing', 'SEO', 'Canva', 'Social Media', 'Communication', 'Problem Solving'
];

/**
 * Calculates match percentage between student skills and job skills.
 */
export function calculateMatchScore(studentSkills: string[], jobSkills: string[]): number {
  if (!jobSkills || jobSkills.length === 0) return 50;
  if (!studentSkills || studentSkills.length === 0) return 20;

  const normalizedStudent = studentSkills.map(s => s.trim().toLowerCase());
  const normalizedJob = jobSkills.map(s => s.trim().toLowerCase());

  let matched = 0;
  for (const js of normalizedJob) {
    if (normalizedStudent.some(ss => ss === js || ss.includes(js) || js.includes(ss))) {
      matched++;
    }
  }

  const percentage = Math.round((matched / normalizedJob.length) * 100);
  return Math.max(15, Math.min(100, percentage));
}

/**
 * Haversine formula to compute distance in km between two GPS coordinates
 */
export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Rule-based ATS Resume Analyzer
 */
export function analyzeResumeText(text: string, currentSkills: string[] = []): {
  score: number;
  detectedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
} {
  const combinedText = (text + ' ' + currentSkills.join(' ')).toLowerCase();
  const detected: string[] = [];

  for (const skill of SKILL_CATALOG) {
    if (combinedText.includes(skill.toLowerCase())) {
      detected.push(skill);
    }
  }

  // Completeness score
  let score = 35;
  if (detected.length >= 3) score += 20;
  if (detected.length >= 6) score += 15;
  if (detected.length >= 10) score += 10;
  if (/education|degree|b\.tech|bca|b\.sc|university|college/i.test(combinedText)) score += 10;
  if (/project|built|developed|created|github/i.test(combinedText)) score += 10;

  score = Math.min(98, score);

  // High demand benchmarks for Indian campus students
  const coreTarget = ['Git', 'React', 'Python', 'SQL', 'Problem Solving', 'Communication'];
  const missing = coreTarget.filter(ts => !detected.some(d => d.toLowerCase() === ts.toLowerCase()));

  const suggestions: string[] = [];
  if (!/github\.com|linkedin\.com/i.test(combinedText)) {
    suggestions.push('Include clickable links to your GitHub profile and LinkedIn.');
  }
  if (!/\d+%|\d+\s*(users|clients|stars|speed|downloads)/i.test(combinedText)) {
    suggestions.push('Quantify your project outcomes with metrics (e.g. "improved load speed by 25%", "used by 200+ students").');
  }
  if (detected.length < 5) {
    suggestions.push('List additional foundational tools such as Git, SQL, or relevant modern libraries.');
  }
  suggestions.push('Use active action verbs (Engineered, Architected, Designed, Spearheaded) instead of passive phrasing.');

  return {
    score,
    detectedSkills: detected,
    missingSkills: missing,
    suggestions
  };
}

/**
 * Job filter and search helper
 */
export function filterJobs(
  jobs: JobItem[],
  params: {
    query?: string;
    city?: string;
    category?: string;
    jobType?: string;
    workArrangement?: string;
    minStipend?: number;
    sortBy?: 'newest' | 'stipend' | 'match' | 'distance';
    userSkills?: string[];
    userLat?: number;
    userLon?: number;
  }
): JobItem[] {
  return jobs.filter(job => {
    // Only approved jobs in search
    if (job.moderationStatus !== 'approved') return false;

    if (params.query) {
      const q = params.query.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchDesc = job.description.toLowerCase().includes(q);
      const matchCompany = job.companyName.toLowerCase().includes(q);
      const matchSkill = job.skills.some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchCompany && !matchSkill) return false;
    }

    if (params.city && params.city !== 'All') {
      const c = params.city.toLowerCase();
      if (!job.city.toLowerCase().includes(c) && !job.locality?.toLowerCase().includes(c)) {
        return false;
      }
    }

    if (params.category && params.category !== 'All' && job.category !== params.category) {
      return false;
    }

    if (params.jobType && params.jobType !== 'All' && job.jobType !== params.jobType) {
      return false;
    }

    if (params.workArrangement && params.workArrangement !== 'All' && job.workArrangement !== params.workArrangement) {
      return false;
    }

    if (params.minStipend && job.salaryMax < params.minStipend) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (params.sortBy === 'stipend') {
      return b.salaryMax - a.salaryMax;
    }
    if (params.sortBy === 'match' && params.userSkills) {
      const scoreA = calculateMatchScore(params.userSkills, a.skills);
      const scoreB = calculateMatchScore(params.userSkills, b.skills);
      return scoreB - scoreA;
    }
    if (params.sortBy === 'distance' && params.userLat && params.userLon) {
      const distA = calculateDistanceKm(params.userLat, params.userLon, a.latitude, a.longitude) ?? 9999;
      const distB = calculateDistanceKm(params.userLat, params.userLon, b.latitude, b.longitude) ?? 9999;
      return distA - distB;
    }
    // Default newest (featured first)
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }
    return b.id - a.id;
  });
}

/**
 * Deduplication helper for external job feed ingestion
 */
export function ingestExternalFeed(
  existingJobs: JobItem[],
  incomingFeed: (Omit<JobItem, 'id' | 'createdAt' | 'viewsCount' | 'moderationStatus'> & { moderationStatus?: JobItem['moderationStatus'] })[]
): {
  updatedList: JobItem[];
  importedCount: number;
  duplicateCount: number;
} {
  let importedCount = 0;
  let duplicateCount = 0;
  const nextId = Math.max(0, ...existingJobs.map(j => j.id)) + 1;
  const currentJobs = [...existingJobs];

  incomingFeed.forEach((item, index) => {
    const isDuplicate = currentJobs.some(
      existing =>
        existing.title.toLowerCase().trim() === item.title.toLowerCase().trim() &&
        existing.city.toLowerCase().trim() === item.city.toLowerCase().trim() &&
        existing.source === item.source
    );

    if (isDuplicate) {
      duplicateCount++;
    } else {
      const newJob: JobItem = {
        ...item,
        id: nextId + index,
        createdAt: new Date().toISOString(),
        viewsCount: 0,
        moderationStatus: 'approved'
      };
      currentJobs.unshift(newJob);
      importedCount++;
    }
  });

  return {
    updatedList: currentJobs,
    importedCount,
    duplicateCount
  };
}
