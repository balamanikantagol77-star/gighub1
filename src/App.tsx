import React, { useState, useEffect, useRef } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Briefcase, Search, MapPin, Building, ShieldCheck, CheckCircle2, 
  FileText, Sparkles, Download, Copy, Check, ExternalLink, 
  Clock, Laptop, SlidersHorizontal, User,
  ArrowRight, ShieldAlert, CreditCard, ChevronRight,
  Bell, Heart, X, Plus, Trash2, Edit3, Eye, CheckCircle, XCircle,
  Settings, Award, RefreshCw, Smartphone, TrendingUp, Users, DollarSign,
  ChevronLeft, Star, Map, Mail, Phone, Code, Layers, FileCheck,
  Mic, MicOff, Globe, Navigation, Lock, Key, Compass, Radio, Calendar,
  GraduationCap, AlertCircle, Share2, Filter, ChevronDown, CheckSquare, Square
} from 'lucide-react';

import { 
  type JobItem, 
  type StudentProfile,
  calculateMatchScore, 
  calculateDistanceKm, 
  analyzeResumeText, 
  filterJobs, 
  ingestExternalFeed 
} from './utils/engine';

// Initial Seed Jobs matching database.sql
const DEFAULT_JOBS: JobItem[] = [
  {
    id: 1,
    recruiterId: 101,
    recruiterName: 'Rohan Deshmukh',
    companyName: 'Innovatech Labs',
    title: 'Junior Web Developer',
    description: 'Join our agile campus team building modern web tools. You will develop responsive UI components, connect REST APIs, and optimize user journeys.',
    responsibilities: '• Build interactive frontend components in React\n• Optimize page loading and bundle size\n• Collaborate in weekly sprint demos',
    qualifications: 'Enrolled in B.Tech/BCA/B.Sc Computer Science. Familiar with HTML5, CSS3, JavaScript, and Git.',
    category: 'Software Development',
    skills: ['React', 'JavaScript', 'Tailwind CSS', 'Git', 'HTML5'],
    jobType: 'internship',
    workArrangement: 'hybrid',
    city: 'Bengaluru',
    locality: 'Koramangala 4th Block',
    latitude: 12.9352,
    longitude: 77.6245,
    salaryMin: 12000,
    salaryMax: 18000,
    stipendType: 'range',
    duration: '3 Months',
    openings: 3,
    deadline: '2026-11-20',
    source: 'recruiter',
    moderationStatus: 'approved',
    isFeatured: true,
    isVerified: true,
    viewsCount: 184,
    createdAt: '2026-10-10'
  },
  {
    id: 2,
    recruiterId: 102,
    recruiterName: 'Sneha Patel',
    companyName: 'InsightAnalytics AI',
    title: 'Junior Data Analyst Trainee',
    description: 'Looking for a fresher with strong analytical mindset to assist in data cleaning, exploratory analysis, dashboard creation in Power BI, and SQL reporting.',
    responsibilities: '• Clean and transform CSV datasets\n• Build executive dashboards in Power BI\n• Write optimized SQL aggregation queries',
    qualifications: 'Degree in Engineering, Math, or Commerce with SQL and Excel proficiency.',
    category: 'Data Science & Analytics',
    skills: ['SQL', 'Python', 'Excel', 'Power BI'],
    jobType: 'internship',
    workArrangement: 'on-site',
    city: 'Hyderabad',
    locality: 'HITEC City Phase 2',
    latitude: 17.4435,
    longitude: 78.3772,
    salaryMin: 10000,
    salaryMax: 15000,
    stipendType: 'range',
    duration: '6 Months',
    openings: 2,
    deadline: '2026-11-15',
    source: 'recruiter',
    moderationStatus: 'approved',
    isFeatured: true,
    isVerified: true,
    viewsCount: 112,
    createdAt: '2026-10-11'
  },
  {
    id: 3,
    recruiterId: 103,
    recruiterName: 'Vikram Mehta',
    companyName: 'EduSphere Studio',
    title: 'Graphic Design & UI Gig',
    description: 'Short-term freelance gig to redesign our student community mobile application. Work closely with product leads to deliver Figma design tokens and wireframes.',
    responsibilities: '• Create interactive Figma wireframes\n• Conduct student usability tests\n• Deliver responsive vector assets and components',
    qualifications: 'Design portfolio with mobile case studies and solid typography principles.',
    category: 'Design & Creative',
    skills: ['Figma', 'UI Design', 'Wireframing', 'Prototyping'],
    jobType: 'freelance',
    workArrangement: 'remote',
    city: 'Pune',
    locality: 'Shivajinagar',
    latitude: 18.5314,
    longitude: 73.8446,
    salaryMin: 8000,
    salaryMax: 12000,
    stipendType: 'fixed',
    duration: '4 Weeks',
    openings: 1,
    deadline: '2026-11-05',
    source: 'recruiter',
    moderationStatus: 'approved',
    isFeatured: false,
    isVerified: true,
    viewsCount: 94,
    createdAt: '2026-10-12'
  },
  {
    id: 4,
    recruiterId: 104,
    recruiterName: 'Aarav Gupta',
    companyName: 'GreenTech Innovations',
    title: 'Campus IoT Energy Monitoring Project',
    description: 'Collaborate with hardware mentors to program ESP32 sensor modules, telemetry over MQTT, and a real-time energy dashboard.',
    responsibilities: '• Program microcontrollers with Arduino C++\n• Set up MQTT telemetry pipeline\n• Test breadboard sensors and calibration',
    qualifications: 'Basic electronics and C/C++ knowledge with passion for smart energy.',
    category: 'College Projects',
    skills: ['C++', 'Arduino', 'ESP32', 'IoT', 'MQTT'],
    jobType: 'project',
    workArrangement: 'on-site',
    city: 'Delhi',
    locality: 'Connaught Place',
    latitude: 28.6315,
    longitude: 77.2167,
    salaryMin: 5000,
    salaryMax: 5000,
    stipendType: 'fixed',
    duration: '2 Months',
    openings: 4,
    deadline: '2026-11-10',
    source: 'recruiter',
    moderationStatus: 'approved',
    isFeatured: true,
    isVerified: false,
    viewsCount: 135,
    createdAt: '2026-10-13'
  },
  {
    id: 5,
    recruiterId: 105,
    recruiterName: 'Natasha Roy',
    companyName: 'YouthPulse Media',
    title: 'Local Content & Campus Social Associate',
    description: 'Part-time opportunity for local college students in Mumbai to capture campus stories, curate Instagram reels, and write short career tips.',
    responsibilities: '• Record reels on campus events\n• Write short blog articles\n• Engage with student communities',
    qualifications: 'Excellent communication in English and Hindi, creative video storytelling.',
    category: 'Marketing & Content',
    skills: ['Content Writing', 'Social Media', 'Canva', 'Video Editing'],
    jobType: 'part-time',
    workArrangement: 'hybrid',
    city: 'Mumbai',
    locality: 'Bandra West',
    latitude: 19.0596,
    longitude: 72.8295,
    salaryMin: 6000,
    salaryMax: 9000,
    stipendType: 'range',
    duration: 'Ongoing',
    openings: 2,
    deadline: '2026-11-25',
    source: 'recruiter',
    moderationStatus: 'approved',
    isFeatured: false,
    isVerified: true,
    viewsCount: 88,
    createdAt: '2026-10-14'
  },
  {
    id: 6,
    recruiterId: 106,
    recruiterName: 'Karthik Rao',
    companyName: 'CloudMatrix Technologies',
    title: 'Remote Python Backend Trainee',
    description: 'Develop RESTful APIs using FastAPI and PostgreSQL. Write unit tests, integrate authentication, and deploy on cloud containers.',
    responsibilities: '• Build modular Python endpoints\n• Design database schemas in PostgreSQL\n• Write automated unit tests',
    qualifications: 'Strong knowledge of Python 3, Object-Oriented principles, and Git.',
    category: 'Software Development',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git'],
    jobType: 'internship',
    workArrangement: 'remote',
    city: 'Bengaluru',
    locality: 'Remote',
    latitude: 12.9716,
    longitude: 77.5946,
    salaryMin: 15000,
    salaryMax: 20000,
    stipendType: 'range',
    duration: '4 Months',
    openings: 2,
    deadline: '2026-11-30',
    source: 'recruiter',
    moderationStatus: 'approved',
    isFeatured: true,
    isVerified: true,
    viewsCount: 220,
    createdAt: '2026-10-15'
  }
];

interface ApplicationRecord {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentCollege: string;
  studentSkills: string[];
  coverLetter: string;
  status: 'applied' | 'under_review' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected' | 'withdrawn';
  appliedAt: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  time: string;
  isRead: boolean;
  applicationId?: number;
  statusType?: 'interviewed' | 'hired';
}

interface JobReport {
  id: number;
  jobId: number;
  jobTitle: string;
  reporter: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

interface StatusAlertToast {
  id: number;
  type: 'interviewed' | 'hired';
  title: string;
  message: string;
  company: string;
  jobTitle: string;
  applicationId?: number;
}

interface GlobalToast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface CampusProject {
  id: number;
  title: string;
  owner: string;
  college: string;
  description: string;
  skills: string[];
  teamSize: number;
  openings: number;
  arrangement: 'remote' | 'on-site' | 'hybrid';
  city: string;
  createdAt: string;
}

export default function App() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<'home' | 'find-jobs' | 'dashboard' | 'applications' | 'campus-projects' | 'resume-builder' | 'analyzer' | 'pricing' | 'deploy'>('dashboard');
  const [appSubTab, setAppSubTab] = useState<'active' | 'completed'>('active');

  // Persistent data state
  const [jobs, setJobs] = useState<JobItem[]>(() => {
    const saved = localStorage.getItem('smart_local_jobs_v3');
    return saved ? JSON.parse(saved) : DEFAULT_JOBS;
  });

  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    const saved = localStorage.getItem('smart_local_applications_v3');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        jobId: 1,
        jobTitle: 'Junior Web Developer',
        companyName: 'Innovatech Labs',
        studentId: 1,
        studentName: 'Alex Rivero',
        studentEmail: 'alex.student@smartlocal.in',
        studentCollege: 'School of Technology & Design',
        studentSkills: ['React', 'JavaScript', 'Tailwind CSS'],
        coverLetter: 'Built multiple college portals and responsive React applications.',
        status: 'interviewed',
        appliedAt: '2026-10-12'
      },
      {
        id: 2,
        jobId: 3,
        jobTitle: 'Graphic Design & UI Gig',
        companyName: 'EduSphere Studio',
        studentId: 1,
        studentName: 'Alex Rivero',
        studentEmail: 'alex.student@smartlocal.in',
        studentCollege: 'School of Technology & Design',
        studentSkills: ['Figma', 'UI Design', 'Wireframing'],
        coverLetter: 'Passionate about student-centered mobile UI with 2 published case studies.',
        status: 'under_review',
        appliedAt: '2026-10-14'
      },
      {
        id: 3,
        jobId: 6,
        jobTitle: 'Remote Python Backend Trainee',
        companyName: 'CloudMatrix Technologies',
        studentId: 1,
        studentName: 'Alex Rivero',
        studentEmail: 'alex.student@smartlocal.in',
        studentCollege: 'School of Technology & Design',
        studentSkills: ['Python', 'FastAPI', 'PostgreSQL'],
        coverLetter: 'Excited about backend microservices and database design.',
        status: 'hired',
        appliedAt: '2026-10-08'
      }
    ];
  });

  const [savedJobIds, setSavedJobIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('smart_local_saved_v3');
    return saved ? JSON.parse(saved) : [1, 2, 3];
  });

  const [campusProjects, setCampusProjects] = useState<CampusProject[]>([
    {
      id: 1,
      title: 'Colleague Event Management System',
      owner: 'Rohan Sharma',
      college: 'Bangalore Institute of Tech',
      description: 'Building an event portal for college fests with QR ticketing and live slot registration.',
      skills: ['React', 'Node.js', 'MongoDB', 'Tailwind'],
      teamSize: 4,
      openings: 2,
      arrangement: 'hybrid',
      city: 'Bengaluru',
      createdAt: '2026-10-14'
    },
    {
      id: 2,
      title: 'AI Chatbot Placement Assistant',
      owner: 'Divya Nair',
      college: 'Pune Engineering College',
      description: 'Developing a campus bot to answer student placement FAQs and parse company mock tests.',
      skills: ['Python', 'FastAPI', 'NLP', 'SQL'],
      teamSize: 3,
      openings: 1,
      arrangement: 'remote',
      city: 'Pune',
      createdAt: '2026-10-15'
    }
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: 'Interview Scheduled!',
      message: 'Innovatech Labs has invited you for an interview for Junior Web Developer on 19 Oct 2026, 10:00 AM.',
      type: 'success',
      time: '1 hour ago',
      isRead: false,
      statusType: 'interviewed',
      applicationId: 1
    },
    {
      id: 2,
      title: 'Offer Extended! 🎉',
      message: 'CloudMatrix Technologies marked your status as Hired for Remote Python Backend Trainee.',
      type: 'success',
      time: '1 day ago',
      isRead: false,
      statusType: 'hired',
      applicationId: 3
    }
  ]);

  const [jobReports, setJobReports] = useState<JobReport[]>([
    {
      id: 1,
      jobId: 4,
      jobTitle: 'Campus IoT Energy Monitoring Project',
      reporter: 'alex.student@gighive.local',
      reason: 'Unverified Recruiter Profile',
      details: 'Please verify the hardware mentor credentials.',
      status: 'pending',
      createdAt: '2026-10-15 14:20'
    }
  ]);

  // Student Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    id: 1,
    userId: 1,
    fullName: 'Alex Rivero',
    email: 'alex.student@gighive.local',
    phone: '(883) 122-3021',
    city: 'Bengaluru',
    locality: 'Koramangala',
    college: 'School of Technology & Design',
    course: 'B.Tech in Computer Science',
    graduationYear: 2026,
    skills: ['React', 'JavaScript', 'Tailwind CSS', 'SQL', 'Git', 'Figma', 'UI Design'],
    latitude: 12.9352,
    longitude: 77.6245
  });

  const [hasSmartPlus, setHasSmartPlus] = useState(false);

  // Student Dashboard Checklist State
  const [dashboardChecklist, setDashboardChecklist] = useState({
    profileComplete: true,
    addProject: false,
    improveSummary: false,
    learnSkill: false,
    applyTwoJobs: true
  });

  // Dedicated Job Catalog Filter States (matching Screen 2 mockup)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('All');
  const [searchCategory, setSearchCategory] = useState('All');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(['All']);
  const [selectedArrangements, setSelectedArrangements] = useState<string[]>(['All']);
  const [maxSalaryFilter, setMaxSalaryFilter] = useState(50000);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'stipend' | 'match' | 'distance'>('newest');

  // Modals
  const [activeJobModal, setActiveJobModal] = useState<JobItem | null>(null);
  const [isApplyingModalOpen, setIsApplyingModalOpen] = useState(false);
  const [applicantName, setApplicantName] = useState(studentProfile.fullName);
  const [applicantEmail, setApplicantEmail] = useState(studentProfile.email);
  const [applyCoverLetter, setApplyCoverLetter] = useState('Enthusiastic to contribute to your team with hands-on project experience.');
  
  // Schedule / Interview Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Demanding Payment or Fees');
  const [reportDetails, setReportDetails] = useState('');

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<{name: string, price: number, duration: string} | null>(null);

  // Dedicated Secret Admin Gateway & Suite (Hidden from public website)
  const [isAdminGatewayOpen, setIsAdminGatewayOpen] = useState(false);
  const [adminInputEmail, setAdminInputEmail] = useState('');
  const [adminInputPassword, setAdminInputPassword] = useState('');
  const [adminAuthSuccess, setAdminAuthSuccess] = useState(false);
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'overview' | 'moderation' | 'recruiters' | 'applications' | 'ingestion' | 'reports' | 'settings'>('overview');
  const [adminCopiedInfo, setAdminCopiedInfo] = useState<string | null>(null);
  const [adminModerationFilter, setAdminModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminCandidateFilter, setAdminCandidateFilter] = useState<'all' | 'under_review' | 'interviewed' | 'hired'>('all');
  
  // Real-time Student Application Status Alert Toast & Notification Center State
  const [activeStatusAlertToast, setActiveStatusAlertToast] = useState<StatusAlertToast | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Global In-App Toast System (non-blocking, iframe-safe)
  const [globalToast, setGlobalToast] = useState<GlobalToast | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setGlobalToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (globalToast) {
      const timer = setTimeout(() => {
        setGlobalToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [globalToast]);

  // Campus Project creation & join state
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectSkills, setNewProjectSkills] = useState('React, TypeScript, Git');
  const [newProjectArrangement, setNewProjectArrangement] = useState<'remote' | 'hybrid' | 'on-site'>('hybrid');
  const [newProjectOpenings, setNewProjectOpenings] = useState(2);
  const [joinedProjectIds, setJoinedProjectIds] = useState<number[]>([]);

  // Withdraw Application Confirmation state
  const [withdrawingAppId, setWithdrawingAppId] = useState<number | null>(null);

  // Admin login error message state
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Play subtle celebratory audio chime on application status upgrade
  const playCelebrationSound = (type: 'interviewed' | 'hired') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'hired') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
        osc.start();
        osc.stop(ctx.currentTime + 0.85);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.14); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      }
    } catch (e) {
      // AudioContext not supported or permission denied
    }
  };

  // Auto-dismiss alert banner after 9 seconds
  useEffect(() => {
    if (activeStatusAlertToast) {
      const timer = setTimeout(() => {
        setActiveStatusAlertToast(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [activeStatusAlertToast]);

  // Click outside notification dropdown to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'GigHive Local',
    siteTagline: 'Your Skills. Your City. Your Next Opportunity.',
    requireModeration: true,
    currencySymbol: '₹',
    razorpayKey: 'rzp_test_placeholder_key'
  });

  // URL Query Check: Detect if user navigated via ?admin=true, ?panel=admin, or #admin
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('admin') === 'true' || searchParams.get('panel') === 'admin' || window.location.hash.toLowerCase().includes('admin')) {
        setIsAdminGatewayOpen(true);
      }
    } catch (e) {
      // safe fallback
    }
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setAdminCopiedInfo(label);
    setTimeout(() => setAdminCopiedInfo(null), 2200);
  };

  // Resume Builder state
  const [builderData, setBuilderData] = useState({
    name: 'Alex Rivero',
    email: 'alex.student@gighive.local',
    phone: '(883) 122-3021',
    city: 'Bengaluru, India',
    links: 'github.com/alex-dev • linkedin.com/in/alex-dev',
    summary: 'Driven undergraduate software developer specializing in React, TypeScript, and modern responsive user interfaces. Passionate about solving real campus problems.',
    education: 'B.Tech in Computer Science & Engineering\nSchool of Technology & Design (2022 - 2026) | CGPA: 8.9 / 10',
    skills: 'JavaScript, React, Tailwind CSS, TypeScript, SQL, Git, Figma, UI/UX Design, REST APIs',
    projects: '• Campus Book Exchange: Full-stack responsive web portal serving 500+ active peers with textbook loans.\n• IoT Smart Energy Logger: Microcontroller pipeline streaming real-time power metrics over MQTT to dashboard.',
    experience: '• Junior Web Developer Intern at Innovatech (3 months): Collaborated on dashboard UI and API connectivity.',
    achievements: '• 1st Place, National Student Hackathon 2025\n• Meta Certified Frontend Developer'
  });

  // Resume Analyzer state
  const [analyzerText, setAnalyzerText] = useState(
    `Alex Rivero\nEmail: alex.student@gighive.local\nEducation: B.Tech in Computer Science School of Technology & Design\nSkills: React, JavaScript, HTML5, Tailwind CSS, SQL, Git, Figma, UI Design, Problem Solving\nProjects: Built full-stack book exchange portal using React and Node.js. Optimized SQL queries for 400+ users.\nCode portfolio: github.com/alex-dev`
  );
  const [analyzerResult, setAnalyzerResult] = useState(() => analyzeResumeText(analyzerText, studentProfile.skills));

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('smart_local_jobs_v3', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('smart_local_applications_v3', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('smart_local_saved_v3', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  const toggleSaveJob = (id: number) => {
    setSavedJobIds(prev => 
      prev.includes(id) ? prev.filter(jId => jId !== id) : [...prev, id]
    );
  };

  const handleOpenApplyModal = (job: JobItem) => {
    setActiveJobModal(job);
    setIsApplyingModalOpen(true);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobModal) return;

    if (applications.some(a => a.jobId === activeJobModal.id && a.studentId === studentProfile.id)) {
      showToast('You have already submitted an application for this opportunity.', 'info');
      setIsApplyingModalOpen(false);
      return;
    }

    const newApp: ApplicationRecord = {
      id: Date.now(),
      jobId: activeJobModal.id,
      jobTitle: activeJobModal.title,
      companyName: activeJobModal.companyName,
      studentId: studentProfile.id,
      studentName: applicantName || studentProfile.fullName,
      studentEmail: applicantEmail || studentProfile.email,
      studentCollege: studentProfile.college || 'Technology Student',
      studentSkills: studentProfile.skills,
      coverLetter: applyCoverLetter || 'I look forward to discussing my qualifications.',
      status: 'under_review',
      appliedAt: new Date().toISOString().split('T')[0]
    };

    setApplications(prev => [newApp, ...prev]);

    const notif: NotificationItem = {
      id: Date.now(),
      title: 'Application Sent! 🚀',
      message: `Your application for "${activeJobModal.title}" at ${activeJobModal.companyName} is in review.`,
      type: 'success',
      time: 'Just now',
      isRead: false
    };
    setNotifications(prev => [notif, ...prev]);

    setIsApplyingModalOpen(false);
    setActiveJobModal(null);
    showToast(`Application submitted to ${activeJobModal.companyName}! Tracking in Applications.`, 'success');
  };

  const handleWithdrawApplication = (appId: number) => {
    setWithdrawingAppId(appId);
  };

  const confirmWithdrawApplication = (appId: number) => {
    setApplications(prev => 
      prev.map(a => a.id === appId ? { ...a, status: 'withdrawn' } : a)
    );
    setWithdrawingAppId(null);
    showToast('Application withdrawn successfully.', 'info');
  };

  // Update student application status and trigger student notification & in-app alert
  const updateApplicationStatus = (appId: number, newStatus: ApplicationRecord['status']) => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const previousStatus = targetApp.status;

    // SPECIFIC REQUIREMENT: Send in-app notification & alert when status changes from 'under_review' to 'interviewed' or 'hired'
    if (previousStatus === 'under_review' && (newStatus === 'interviewed' || newStatus === 'hired')) {
      const isHired = newStatus === 'hired';
      const notifTitle = isHired 
        ? `Congratulations! You're Hired! 🎉` 
        : `Interview Invitation! 📅`;
      const notifMsg = isHired
        ? `Great news! ${targetApp.companyName} has finalized your application for "${targetApp.jobTitle}" and extended an official offer!`
        : `Exciting update! ${targetApp.companyName} reviewed your application for "${targetApp.jobTitle}" and scheduled you for an interview.`;

      const newNotif: NotificationItem = {
        id: Date.now(),
        title: notifTitle,
        message: notifMsg,
        type: 'success',
        time: 'Just now',
        isRead: false,
        applicationId: appId,
        statusType: newStatus
      };

      setNotifications(curr => [newNotif, ...curr]);

      // Trigger prominent celebratory in-app alert banner
      setActiveStatusAlertToast({
        id: Date.now(),
        type: newStatus,
        title: notifTitle,
        message: notifMsg,
        company: targetApp.companyName,
        jobTitle: targetApp.jobTitle,
        applicationId: appId
      });

      // Play audio chime
      playCelebrationSound(newStatus);
    }

    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobModal) return;

    const report: JobReport = {
      id: Date.now(),
      jobId: activeJobModal.id,
      jobTitle: activeJobModal.title,
      reporter: studentProfile.email,
      reason: reportReason,
      details: reportDetails,
      status: 'pending',
      createdAt: new Date().toLocaleString()
    };

    setJobReports(prev => [report, ...prev]);
    setIsReportModalOpen(false);
    setReportDetails('');
    showToast('Listing reported. Our moderation team reviews scam reports within 24 hours.', 'info');
  };

  const handleSimulatePayment = () => {
    if (!selectedPlanToBuy) return;
    setHasSmartPlus(true);
    setIsPaymentModalOpen(false);
    
    const notif: NotificationItem = {
      id: Date.now(),
      title: 'Smart Plus Activated! ⚡',
      message: `Upgraded to ${selectedPlanToBuy.name}. Unlimited applications unlocked.`,
      type: 'success',
      time: 'Just now',
      isRead: false
    };
    setNotifications(prev => [notif, ...prev]);
    showToast(`Payment of ₹${selectedPlanToBuy.price} confirmed! Smart Plus membership is now active.`, 'success');
  };

  // Filtered jobs using domain logic for dedicated Job Catalog
  const effectiveCategory = searchCategory === 'All' ? undefined : searchCategory;
  const effectiveCity = searchCity === 'All' ? undefined : searchCity;
  const effectiveJobType = selectedJobTypes.includes('All') ? undefined : selectedJobTypes[0];
  const effectiveArrangement = selectedArrangements.includes('All') ? undefined : selectedArrangements[0];

  const filteredCatalogJobs = filterJobs(jobs, {
    query: searchQuery,
    city: effectiveCity,
    category: effectiveCategory,
    jobType: effectiveJobType,
    workArrangement: effectiveArrangement,
    minStipend: maxSalaryFilter,
    sortBy: sortBy,
    userSkills: selectedSkillFilter.length > 0 ? selectedSkillFilter : studentProfile.skills,
    userLat: studentProfile.latitude,
    userLon: studentProfile.longitude
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Dynamically calculate applications received over the last 7 days for Recharts
  const sevenDayAppStats = (() => {
    const days: { date: string; displayDate: string; shortDate: string; applications: number }[] = [];
    const baselineDailyCounts = [4, 7, 5, 11, 8, 14, 9];
    const referenceDate = new Date('2026-10-16T12:00:00');

    for (let i = 6; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const realMatches = applications.filter(a => a.appliedAt === dateStr).length;
      const count = baselineDailyCounts[6 - i] + realMatches;

      days.push({
        date: dateStr,
        displayDate: `${displayDate} (${dayName})`,
        shortDate: displayDate,
        applications: count
      });
    }
    return days;
  })();

  const total7DayApps = sevenDayAppStats.reduce((sum, d) => sum + d.applications, 0);

  // SVG Brand Logo Component matching uploaded image
  const BrandLogo = ({ size = 'default' }: { size?: 'default' | 'large' | 'small' }) => {
    const isSmall = size === 'small';
    return (
      <div className="flex items-center gap-2.5 cursor-pointer select-none">
        <svg 
          viewBox="0 0 100 100" 
          className={isSmall ? "w-8 h-8 shrink-0" : "w-10 h-10 shrink-0"}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Skyline Buildings in Blue */}
          <rect x="58" y="42" width="10" height="30" rx="1.5" fill="#1E3A8A" opacity="0.85" />
          <rect x="70" y="32" width="12" height="40" rx="1.5" fill="#2563EB" opacity="0.9" />
          <rect x="84" y="46" width="9" height="26" rx="1.5" fill="#3B82F6" opacity="0.8" />
          
          {/* Green Career Growth Pathway */}
          <path 
            d="M20 78 C40 76, 65 62, 92 64 C96 64.5, 96 68.5, 90 71 C65 74, 40 86, 20 86 Z" 
            fill="#10B981" 
          />
          <path 
            d="M24 77 C44 75, 68 63, 90 65" 
            stroke="#34D399" 
            strokeWidth="1.5" 
            strokeDasharray="3 3" 
          />

          {/* Location Pin */}
          <path 
            d="M48 20 C34 20, 24 30.5, 24 44 C24 57, 44 76, 48 80 C52 76, 72 57, 72 44 C72 30.5, 62 20, 48 20 Z" 
            fill="url(#pinGradient)" 
          />
          <circle cx="48" cy="42" r="17" fill="#FFFFFF" />

          {/* Briefcase inside Pin */}
          <rect x="39" y="36" width="18" height="13" rx="2" fill="#1E3A8A" />
          <path d="M44 36 V33 C44 32, 45 31, 46 31 H50 C51 31, 52 32, 52 33 V36" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" />
          <rect x="46" y="41" width="4" height="3" rx="0.5" fill="#FFFFFF" />

          {/* Graduation Cap on Top */}
          <polygon points="48,8 24,19 48,27 72,19" fill="#0F172A" />
          <polygon points="48,27 34,20 34,24 48,30 62,24 62,20" fill="#1E293B" />
          <path d="M66 21 V32" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="66" cy="33" r="1.5" fill="#F59E0B" />

          <defs>
            <linearGradient id="pinGradient" x1="24" y1="20" x2="72" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1D4ED8" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
          </defs>
        </svg>

        <div>
          <div className="flex items-center">
            <span className="font-black text-lg tracking-tight text-slate-900">GigHive</span>
            <span className="font-black text-lg tracking-tight text-emerald-600 ml-1">Local</span>
          </div>
          <span className="block text-[9px] font-semibold text-slate-500 tracking-tight -mt-0.5">
            Your Skills. Your City. Your Next Opportunity.
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* TOP HEADER (MODERN CRISP SAAS STYLE WITH DEEP NAVY / ROYAL BLUE) */}
      {/* ============================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div onClick={() => setActiveTab('dashboard')}>
              <BrandLogo />
            </div>

            {/* Navigation Tabs matching design collection */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <button 
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'home' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => setActiveTab('find-jobs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  activeTab === 'find-jobs' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find Jobs</span>
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'dashboard' ? 'saas-pill-active' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveTab('applications')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  activeTab === 'applications' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Applications</span>
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                  {applications.length}
                </span>
              </button>
              <button 
                onClick={() => setActiveTab('campus-projects')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'campus-projects' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Projects
              </button>
              <button 
                onClick={() => setActiveTab('resume-builder')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'resume-builder' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resume
              </button>
              <button 
                onClick={() => setActiveTab('analyzer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'analyzer' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ATS Test
              </button>
              <button 
                onClick={() => setActiveTab('pricing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'pricing' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pricing
              </button>
            </nav>

            {/* Right Controls: Notifications & Profile Pill */}
            <div className="flex items-center gap-3">
              
              {/* Notification Center */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-xl text-slate-600 relative transition border ${
                    isNotificationsOpen 
                      ? 'bg-blue-50 border-blue-400 text-blue-600' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Notifications & Status Alerts"
                  aria-label="Toggle notifications menu"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center shadow-xs animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-alert-toast">
                    <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-full border border-blue-200">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                              setActiveTab('applications');
                              setIsNotificationsOpen(false);
                            }}
                            className={`p-3 rounded-xl text-xs border transition cursor-pointer flex items-start gap-2.5 ${
                              !n.isRead 
                                ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                              n.statusType === 'hired'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                : n.statusType === 'interviewed'
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {n.statusType === 'hired' ? (
                                <Award className="w-4 h-4" />
                              ) : n.statusType === 'interviewed' ? (
                                <Calendar className="w-4 h-4" />
                              ) : (
                                <Bell className="w-4 h-4" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs">{n.title}</span>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                                <span>{n.time}</span>
                                <span className="text-blue-600 hover:underline flex items-center gap-0.5 font-sans">
                                  View application →
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Pill matching Screen 3 mockup */}
              <div 
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 p-1 pl-2 pr-3 bg-slate-100 hover:bg-slate-200/80 rounded-full border border-slate-200 cursor-pointer transition"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  AR
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-slate-800 leading-tight">Alex Rivero</span>
                  <span className="block text-[10px] text-emerald-600 font-semibold leading-none">Student</span>
                </div>
              </div>

              {/* Hosting Files Button */}
              <button
                onClick={() => setActiveTab('deploy')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hosting Files</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* REAL-TIME STUDENT APPLICATION STATUS CHANGE IN-APP ALERT BANNER */}
      {/* ============================================================== */}
      {activeStatusAlertToast && (
        <aside 
          aria-label="Application status update notification"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-full animate-alert-toast"
        >
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl backdrop-blur-xl relative overflow-hidden bg-white ${
            activeStatusAlertToast.type === 'hired'
              ? 'border-emerald-400 ring-2 ring-emerald-500/20'
              : 'border-blue-400 ring-2 ring-blue-500/20'
          }`}>
            <div className="flex items-start gap-3.5 relative z-10">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                activeStatusAlertToast.type === 'hired'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
                {activeStatusAlertToast.type === 'hired' ? (
                  <Award className="w-6 h-6 animate-pulse" />
                ) : (
                  <Calendar className="w-6 h-6 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    activeStatusAlertToast.type === 'hired'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activeStatusAlertToast.type === 'hired' ? 'Official Offer' : 'Interview Stage'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Just Now</span>
                </div>

                <h3 className="text-sm font-black text-slate-900 mt-1 leading-snug">
                  {activeStatusAlertToast.title}
                </h3>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {activeStatusAlertToast.message}
                </p>

                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setActiveTab('applications');
                      setActiveStatusAlertToast(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xs ${
                      activeStatusAlertToast.type === 'hired'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <span>View in Applications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveStatusAlertToast(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <button
                onClick={() => setActiveStatusAlertToast(null)}
                className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                aria-label="Close alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full animate-toast-progress ${
                activeStatusAlertToast.type === 'hired' ? 'bg-emerald-500' : 'bg-blue-600'
              }`} />
            </div>
          </div>
        </aside>
      )}

      {/* ============================================================== */}
      {/* GLOBAL IN-APP NON-BLOCKING TOAST NOTIFICATION                  */}
      {/* ============================================================== */}
      {globalToast && (
        <aside 
          role="status" 
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-full animate-alert-toast"
        >
          <div className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold text-white ${
            globalToast.type === 'error' ? 'bg-rose-600 border-rose-500 shadow-rose-900/20' :
            globalToast.type === 'warning' ? 'bg-amber-600 border-amber-500 shadow-amber-900/20' :
            globalToast.type === 'info' ? 'bg-blue-600 border-blue-500 shadow-blue-900/20' :
            'bg-slate-900 border-slate-700 shadow-slate-900/30'
          }`}>
            <div className="flex items-center gap-2.5">
              {globalToast.type === 'error' ? (
                <XCircle className="w-4 h-4 shrink-0 text-white" />
              ) : globalToast.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span className="leading-snug">{globalToast.message}</span>
            </div>
            <button 
              onClick={() => setGlobalToast(null)} 
              className="p-1 text-slate-300 hover:text-white rounded-lg transition shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* ============================================================== */}
      {/* MAIN CONTAINER                                                 */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ================================================================ */}
        {/* VIEW: STUDENT DASHBOARD (SCREEN 3 MATCHING MOCKUP COLLECTION)    */}
        {/* ================================================================ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Personalized Greeting Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  Welcome back, {studentProfile.fullName.split(' ')[0]}! 🎓
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Your next opportunity in <strong className="text-slate-900">{studentProfile.city}</strong> is just a step away.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveTab('find-jobs')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Opportunities</span>
                </button>
                <button
                  onClick={() => setActiveTab('resume-builder')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit Resume</span>
                </button>
              </div>
            </div>

            {/* 4 Top Quick Stats Cards matching Screen 3 mockup */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Profile Complete */}
              <div className="saas-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profile Complete</span>
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">72%</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>

              {/* Card 2: Resume Ready */}
              <div className="saas-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resume Ready</span>
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">88%</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ATS Verified</span>
                </div>
              </div>

              {/* Card 3: Saved Jobs */}
              <div className="saas-card p-4 cursor-pointer hover:border-blue-300" onClick={() => setActiveTab('find-jobs')}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saved Jobs</span>
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{savedJobIds.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Bookmarked opportunities</div>
              </div>

              {/* Card 4: Applications */}
              <div className="saas-card p-4 cursor-pointer hover:border-blue-300" onClick={() => setActiveTab('applications')}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Applications</span>
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{applications.length}</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-1">
                  {applications.filter(a => a.status === 'interviewed' || a.status === 'hired').length} Active Updates
                </div>
              </div>
            </div>

            {/* Split Section: Career Progress Ring & Recommended / Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Career Progress Score & Action Checklist */}
              <div className="lg:col-span-5 saas-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-base text-slate-900">Career Progress</h3>
                      <p className="text-xs text-slate-500">Based on your skills, resume & activities</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Tier 2 Student
                    </span>
                  </div>

                  {/* Circular Progress Gauge */}
                  <div className="flex items-center justify-center py-6">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#E2E8F0"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* Progress stroke */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#2563EB"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 * (1 - 0.72)}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900">72%</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Readiness</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps Actionable Checklist matching mockup */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Next Steps:</h4>
                    
                    <div 
                      onClick={() => setDashboardChecklist(prev => ({ ...prev, addProject: !prev.addProject }))}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-2.5 cursor-pointer transition text-xs"
                    >
                      {dashboardChecklist.addProject ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={dashboardChecklist.addProject ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                        Add a project to your profile
                      </span>
                    </div>

                    <div 
                      onClick={() => setDashboardChecklist(prev => ({ ...prev, improveSummary: !prev.improveSummary }))}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-2.5 cursor-pointer transition text-xs"
                    >
                      {dashboardChecklist.improveSummary ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={dashboardChecklist.improveSummary ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                        Improve your resume summary
                      </span>
                    </div>

                    <div 
                      onClick={() => setDashboardChecklist(prev => ({ ...prev, learnSkill: !prev.learnSkill }))}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-2.5 cursor-pointer transition text-xs"
                    >
                      {dashboardChecklist.learnSkill ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={dashboardChecklist.learnSkill ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                        Learn one missing skill (FastAPI / SQL)
                      </span>
                    </div>

                    <div 
                      onClick={() => setDashboardChecklist(prev => ({ ...prev, applyTwoJobs: !prev.applyTwoJobs }))}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-2.5 cursor-pointer transition text-xs"
                    >
                      {dashboardChecklist.applyTwoJobs ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={dashboardChecklist.applyTwoJobs ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                        Apply to 2 new campus opportunities
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('analyzer')}
                  className="mt-5 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition border border-blue-200 flex items-center justify-center gap-1.5"
                >
                  <span>Detailed Resume & Skill Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right Column: Recommended Jobs & Upcoming Interviews */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Upcoming Interviews Box matching Screen 3 mockup */}
                <div className="saas-card p-5 border-l-4 border-l-blue-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-sm text-slate-900">Upcoming Interviews</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      1 Scheduled
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Technical Interview (Round 1)</div>
                      <div className="text-xs text-slate-600 mt-0.5">Innovatech Labs • Junior Web Developer</div>
                      <div className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>19 Oct 2026, 10:00 AM (Google Meet)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs shrink-0"
                    >
                      View Schedule
                    </button>
                  </div>
                </div>

                {/* Recommended Jobs Widget matching mockup */}
                <div className="saas-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Recommended For You</h3>
                      <p className="text-xs text-slate-500">Matched with your skills in React, JavaScript, SQL</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('find-jobs')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {jobs.slice(0, 3).map(job => {
                      const match = calculateMatchScore(studentProfile.skills, job.skills);
                      return (
                        <div 
                          key={job.id}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{job.title}</span>
                              <span className="saas-emerald-pill px-2 py-0.2 rounded-full text-[10px] font-bold">
                                {match}% Match
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {job.companyName} • {job.city} • ₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenApplyModal(job)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs shrink-0"
                          >
                            Apply
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Section: Recent Applications Journey Table matching Screen 3 & 8 */}
            <div className="saas-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-base text-slate-900">Recent Applications Journey</h3>
                  <p className="text-xs text-slate-500">Track and manage your submitted applications</p>
                </div>
                <button
                  onClick={() => setActiveTab('applications')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
                >
                  Manage All ({applications.length})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Role & Title</th>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Applied On</th>
                      <th className="py-2.5 px-3 text-right">Quick Test Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map(app => {
                      const isUnderReview = app.status === 'under_review';
                      const isInterviewed = app.status === 'interviewed';
                      const isHired = app.status === 'hired';

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-bold text-slate-900">{app.jobTitle}</td>
                          <td className="py-3 px-3 text-slate-600">{app.companyName}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isHired ? 'bg-emerald-100 text-emerald-800' :
                              isInterviewed ? 'bg-blue-100 text-blue-800' :
                              isUnderReview ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {app.status === 'under_review' ? '⏳ Under Review' :
                               app.status === 'interviewed' ? '📅 Interviewed' :
                               app.status === 'hired' ? '🎉 Hired' : app.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{app.appliedAt}</td>
                          <td className="py-3 px-3 text-right">
                            {isUnderReview ? (
                              <div className="inline-flex gap-1.5">
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'interviewed')}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                                >
                                  Move to Interview 📅
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'hired')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                                >
                                  Move to Hired 🎉
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => updateApplicationStatus(app.id, 'under_review')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px] border border-slate-200"
                              >
                                Reset to Under Review 🔄
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: DEDICATED JOB CATALOG WITH SIDEBAR FILTERS (SCREEN 2)      */}
        {/* ================================================================ */}
        {activeTab === 'find-jobs' && (
          <div className="space-y-6">
            
            {/* Top Search Query Bar matching Screen 2 mockup */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                <div className="md:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search from thousands of local jobs, internships, gigs..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All Cities</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All Categories</option>
                    <option value="Software Development">Software Development</option>
                    <option value="Data Science & Analytics">Data Science & Analytics</option>
                    <option value="Design & Creative">Design & Creative</option>
                    <option value="Marketing & Content">Marketing & Content</option>
                    <option value="College Projects">College Projects</option>
                  </select>
                </div>

                <div className="md:col-span-1">
                  <button 
                    onClick={() => {
                      showToast(`Found ${filteredCatalogJobs.length} opportunities matching your criteria`, 'info');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center"
                  >
                    Search
                  </button>
                </div>

              </div>
            </div>

            {/* Split Layout: Left Filter Sidebar + Right Opportunities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Sticky Filter Sidebar matching Screen 2 mockup */}
              <div className="lg:col-span-4 saas-card p-5 space-y-5 sticky top-20">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <h3 className="font-black text-sm text-slate-900">Filters</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchCity('All');
                      setSearchCategory('All');
                      setSelectedJobTypes(['All']);
                      setSelectedArrangements(['All']);
                      setMaxSalaryFilter(50000);
                      setSelectedSkillFilter([]);
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Job Type Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Job Type</label>
                  <div className="space-y-1.5 text-xs">
                    {['All', 'internship', 'part-time', 'freelance', 'remote'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedJobTypes.includes(type)}
                          onChange={() => {
                            if (type === 'All') {
                              setSelectedJobTypes(['All']);
                            } else {
                              const withoutAll = selectedJobTypes.filter(t => t !== 'All');
                              if (withoutAll.includes(type)) {
                                const next = withoutAll.filter(t => t !== type);
                                setSelectedJobTypes(next.length === 0 ? ['All'] : next);
                              } else {
                                setSelectedJobTypes([...withoutAll, type]);
                              }
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Arrangement */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Work Arrangement</label>
                  <div className="space-y-1.5 text-xs">
                    {['All', 'on-site', 'hybrid', 'remote'].map(arr => (
                      <label key={arr} className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedArrangements.includes(arr)}
                          onChange={() => {
                            if (arr === 'All') {
                              setSelectedArrangements(['All']);
                            } else {
                              const withoutAll = selectedArrangements.filter(t => t !== 'All');
                              if (withoutAll.includes(arr)) {
                                const next = withoutAll.filter(t => t !== arr);
                                setSelectedArrangements(next.length === 0 ? ['All'] : next);
                              } else {
                                setSelectedArrangements([...withoutAll, arr]);
                              }
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize">{arr}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stipend Range Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-800">Minimum Stipend</label>
                    <span className="text-xs font-bold text-blue-600 font-mono">₹{maxSalaryFilter.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="50000"
                    step="2500"
                    value={maxSalaryFilter}
                    onChange={(e) => setMaxSalaryFilter(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>₹5,000</span>
                    <span>₹50,000+</span>
                  </div>
                </div>

                {/* Skills Tag Pills Multi-Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Skills Filter</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'Python', 'SQL', 'Git', 'Figma', 'Node.js', 'Tailwind'].map(skill => {
                      const isSelected = selectedSkillFilter.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSkillFilter(selectedSkillFilter.filter(s => s !== skill));
                            } else {
                              setSelectedSkillFilter([...selectedSkillFilter, skill]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort By Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Sort Results By</label>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="newest">Newest First</option>
                    <option value="match">Highest Skill Match</option>
                    <option value="stipend">Highest Stipend</option>
                    <option value="distance">Nearest Distance</option>
                  </select>
                </div>

              </div>

              {/* Right Opportunities Grid matching Screen 2 mockup */}
              <div className="lg:col-span-8 space-y-4">
                
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-600">
                    Showing <strong className="text-slate-900">{filteredCatalogJobs.length}</strong> opportunities
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>City: <strong>{searchCity}</strong></span>
                  </div>
                </div>

                {filteredCatalogJobs.length === 0 ? (
                  <div className="saas-card p-12 text-center text-slate-500 space-y-3">
                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-800">No opportunities match these filters</h4>
                    <p className="text-xs">Try resetting or broadening your search criteria.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchCity('All');
                        setSearchCategory('All');
                        setSelectedJobTypes(['All']);
                        setSelectedArrangements(['All']);
                        setMaxSalaryFilter(50000);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  filteredCatalogJobs.map(job => {
                    const match = calculateMatchScore(studentProfile.skills, job.skills);
                    const isSaved = savedJobIds.includes(job.id);
                    const hasApplied = applications.some(a => a.jobId === job.id);

                    return (
                      <div 
                        key={job.id}
                        className="saas-card p-5 hover:border-blue-300 transition flex flex-col justify-between space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Company Avatar Initial */}
                            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                              {job.companyName.charAt(0)}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 
                                  onClick={() => setActiveJobModal(job)}
                                  className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition line-clamp-1"
                                >
                                  {job.title}
                                </h3>
                                {job.isVerified && (
                                  <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                                    <span>Verified</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                                <span className="font-semibold">{job.companyName}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-slate-500">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {job.locality ? `${job.locality}, ${job.city}` : job.city}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Match score & Bookmark */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="saas-emerald-pill px-2.5 py-1 rounded-full text-xs font-bold">
                              {match}% Match
                            </span>
                            <button
                              onClick={() => toggleSaveJob(job.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-400 hover:text-rose-500"
                              title="Bookmark job"
                            >
                              <Heart className="w-4 h-4" fill={isSaved ? '#f43f5e' : 'none'} color={isSaved ? '#f43f5e' : '#94a3b8'} />
                            </button>
                          </div>
                        </div>

                        {/* Salary and Work Arrangement Box */}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg font-mono">
                            ₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()} / mo
                          </span>
                          <span className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg capitalize">
                            {job.workArrangement}
                          </span>
                          <span className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg capitalize">
                            {job.jobType}
                          </span>
                        </div>

                        {/* Skills and Apply Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.map((sk, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                                {sk}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              onClick={() => setActiveJobModal(job)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
                            >
                              Details
                            </button>
                            {hasApplied ? (
                              <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs">
                                Applied ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenApplyModal(job)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                              >
                                Apply Now
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}

              </div>

            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: HOME LANDING PAGE (SCREEN 1 MATCHING MOCKUP COLLECTION)    */}
        {/* ================================================================ */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            
            {/* Hero Section matching Panel 1 of Mockup */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl space-y-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold inline-block">
                  #1 Student Career & Local Opportunity Platform
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Find Opportunities That Match Your Skills and Your <span className="text-blue-600">Location.</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Discover internships, local jobs, freelance gigs, and student projects. Build a stronger resume and take the next step in your career with <strong className="text-slate-900">GigHive Local</strong>.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button 
                    onClick={() => setActiveTab('find-jobs')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                  >
                    <span>Find Opportunities</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('resume-builder')}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 transition"
                  >
                    Build My Resume
                  </button>
                </div>
              </div>

              {/* Hero Graphic Badge */}
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-tr from-blue-50 to-slate-100 border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-inner relative shrink-0">
                <BrandLogo size="large" />
                <div className="mt-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs w-full text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">Campus Match</span>
                    <span className="saas-emerald-pill px-1.5 py-0.2 rounded text-[10px] font-bold">96%</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">Junior Web Developer • Innovatech</div>
                </div>
              </div>
            </div>

            {/* Category Cards matching Screen 1 mockup */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 text-center">Popular Opportunity Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { title: 'Internships', count: '14 Active', icon: Briefcase, color: 'text-blue-600' },
                  { title: 'Part-Time Jobs', count: '8 Active', icon: Clock, color: 'text-emerald-600' },
                  { title: 'Freelance Gigs', count: '12 Active', icon: Laptop, color: 'text-indigo-600' },
                  { title: 'Remote Jobs', count: '19 Active', icon: Globe, color: 'text-sky-600' },
                  { title: 'Campus Projects', count: '6 Active', icon: Code, color: 'text-amber-600' },
                  { title: 'Local Jobs', count: '24 Active', icon: MapPin, color: 'text-rose-600' }
                ].map((cat, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSearchCategory(cat.title === 'Campus Projects' ? 'College Projects' : 'All');
                      setActiveTab('find-jobs');
                    }}
                    className="saas-card p-4 text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition space-y-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center">
                      <cat.icon className={`w-5 h-5 ${cat.color}`} />
                    </div>
                    <div className="font-bold text-xs text-slate-900">{cat.title}</div>
                    <div className="text-[10px] text-slate-500">{cat.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* "Why Choose GigHive Local?" matching Panel 1 of Mockup */}
            <div className="saas-card p-8">
              <h3 className="text-xl font-black text-slate-900 text-center mb-6">Why Choose GigHive Local?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-200">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Local Opportunities</h4>
                  <p className="text-xs text-slate-600">Discover gigs, internships, and entry roles in your city and locality.</p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Smart Matching</h4>
                  <p className="text-xs text-slate-600">Explainable skill overlap scores so you know exactly why you match.</p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-200">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">ATS Resume Builder</h4>
                  <p className="text-xs text-slate-600">Build and print professional, scanner-ready resumes with zero hassle.</p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Secure & Verified</h4>
                  <p className="text-xs text-slate-600">Recruiter checks and scam reporting safeguard student job seekers.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: APPLICATION JOURNEY TRACKER (SCREEN 8 MATCHING MOCKUP)     */}
        {/* ================================================================ */}
        {activeTab === 'applications' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('dashboard')} className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:text-slate-900 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Application Journey Tracker</h2>
                  <p className="text-xs text-slate-500">Real-time alerts, interview invitations & hiring updates</p>
                </div>
              </div>

              {/* Status Tabs matching Screen 8 mockup */}
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
                <button 
                  onClick={() => setAppSubTab('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    appSubTab === 'active' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({applications.filter(a => !['hired', 'rejected', 'withdrawn'].includes(a.status)).length})
                </button>
                <button 
                  onClick={() => setAppSubTab('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    appSubTab === 'completed' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completed ({applications.filter(a => ['hired', 'rejected', 'withdrawn'].includes(a.status)).length})
                </button>
              </div>
            </div>

            {/* In-App Status Notification Feature Announcement Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">Live Student Status Alerts Active</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    When an employer updates an application from <strong className="text-amber-700">Under Review</strong> to <strong className="text-blue-700">Interviewed</strong> or <strong className="text-emerald-700">Hired</strong>, you receive an immediate in-app sound chime, popup toast banner, and notification bell alert.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const underReviewApp = applications.find(a => a.status === 'under_review') || applications[0];
                  if (underReviewApp) {
                    updateApplicationStatus(underReviewApp.id, 'interviewed');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Test Interview Alert ⚡</span>
              </button>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {applications.filter(a => appSubTab === 'active' 
                ? !['hired', 'rejected', 'withdrawn'].includes(a.status)
                : ['hired', 'rejected', 'withdrawn'].includes(a.status)).length === 0 ? (
                <div className="saas-card p-10 text-center text-slate-500 space-y-3">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No {appSubTab} applications found</h4>
                  <p className="text-xs">Browse local opportunities, apply to roles, and track real-time progress here.</p>
                  <button
                    onClick={() => setActiveTab('find-jobs')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Find Opportunities
                  </button>
                </div>
              ) : (
                applications
                  .filter(a => appSubTab === 'active' 
                    ? !['hired', 'rejected', 'withdrawn'].includes(a.status)
                    : ['hired', 'rejected', 'withdrawn'].includes(a.status))
                  .map(app => {
                    const isUnderReview = app.status === 'under_review';
                    const isInterviewed = app.status === 'interviewed';
                    const isHired = app.status === 'hired';

                    return (
                      <div 
                        key={app.id}
                        className={`saas-card p-5 space-y-4 ${
                          isHired 
                            ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                            : isInterviewed
                            ? 'border-blue-300 ring-2 ring-blue-500/10'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900">{app.jobTitle}</h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isHired ? 'bg-emerald-100 text-emerald-800' :
                                isInterviewed ? 'bg-blue-100 text-blue-800' :
                                isUnderReview ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {app.status === 'under_review' ? '⏳ Under Review' : 
                                 app.status === 'interviewed' ? '📅 Interview Scheduled' :
                                 app.status === 'hired' ? '🎉 Hired & Extended Offer' : app.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span>{app.companyName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-mono text-[11px]">Applied {app.appliedAt}</span>
                            </p>
                          </div>

                          {appSubTab === 'active' && (
                            <button 
                              onClick={() => handleWithdrawApplication(app.id)}
                              className="text-[11px] text-slate-400 hover:text-rose-600 transition self-start sm:self-center"
                            >
                              Withdraw Application
                            </button>
                          )}
                        </div>

                        {/* 4-Step Application Progress Tracker matching Screen 8 mockup */}
                        <div className="py-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Application Journey Status:
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {/* Step 1: Applied */}
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                ✓
                              </div>
                              <span className="text-[10px] font-bold text-slate-900 mt-1">Submitted</span>
                              <span className="text-[9px] text-slate-400">{app.appliedAt}</span>
                            </div>

                            {/* Step 2: Under Review */}
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                ['under_review', 'interviewed', 'hired'].includes(app.status)
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {['interviewed', 'hired'].includes(app.status) ? '✓' : '2'}
                              </div>
                              <span className={`text-[10px] font-bold mt-1 ${
                                ['under_review', 'interviewed', 'hired'].includes(app.status) ? 'text-slate-900' : 'text-slate-400'
                              }`}>
                                Under Review
                              </span>
                              <span className="text-[9px] text-slate-400">Screening</span>
                            </div>

                            {/* Step 3: Interviewed */}
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                ['interviewed', 'hired'].includes(app.status)
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {app.status === 'hired' ? '✓' : '3'}
                              </div>
                              <span className={`text-[10px] font-bold mt-1 ${
                                ['interviewed', 'hired'].includes(app.status) ? 'text-blue-600 font-extrabold' : 'text-slate-400'
                              }`}>
                                Interview
                              </span>
                              <span className="text-[9px] text-slate-400">Technical Round</span>
                            </div>

                            {/* Step 4: Hired */}
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                app.status === 'hired'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {app.status === 'hired' ? '★' : '4'}
                              </div>
                              <span className={`text-[10px] font-bold mt-1 ${
                                app.status === 'hired' ? 'text-emerald-700 font-extrabold' : 'text-slate-400'
                              }`}>
                                Offer / Hired
                              </span>
                              <span className="text-[9px] text-slate-400">Final Decision</span>
                            </div>
                          </div>
                        </div>

                        {/* Recruiter Simulation Bar */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <div className="text-[11px] text-slate-600">
                            <strong className="text-slate-900">Status Change Simulator: </strong>
                            <span>Trigger the real-time notification alert and celebratory banner for this application.</span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {isUnderReview ? (
                              <>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'interviewed')}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-xs transition"
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>Move to Interview (📅 Alert)</span>
                                </button>

                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'hired')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-xs transition"
                                >
                                  <Award className="w-3 h-3" />
                                  <span>Move to Hired (🎉 Alert)</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  updateApplicationStatus(app.id, 'under_review');
                                }}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-[10px] border border-slate-200 flex items-center gap-1 transition shadow-xs"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reset to &quot;Under Review&quot; (Re-test Alerts)</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: CAMPUS PROJECTS COLLABORATION (SCREEN 9 MATCHING MOCKUP)   */}
        {/* ================================================================ */}
        {activeTab === 'campus-projects' && (
          <div className="space-y-6">
            <div className="saas-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Campus Project & Teammate Finder</h2>
                <p className="text-xs text-slate-600">Find engineering peers, UI/UX designers, and hackathon co-builders.</p>
              </div>

              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Campus Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campusProjects.map(proj => (
                <div key={proj.id} className="saas-card p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {proj.arrangement}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {proj.openings} Positions Open
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{proj.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                    <div className="text-xs text-slate-500 pt-1">
                      Lead: <strong className="text-slate-800">{proj.owner}</strong> • {proj.college} ({proj.city})
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.skills.map((sk, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Team Size: {proj.teamSize}</span>
                    {joinedProjectIds.includes(proj.id) ? (
                      <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Request Sent</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setJoinedProjectIds(prev => [...prev, proj.id]);
                          showToast(`Connection request sent to ${proj.owner} for "${proj.title}"!`, 'success');
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                      >
                        Connect & Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: RESUME BUILDER (SCREEN 6 MATCHING MOCKUP)                  */}
        {/* ================================================================ */}
        {activeTab === 'resume-builder' && (
          <div className="space-y-6">
            <div className="saas-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">ATS College Resume Builder</h2>
                <p className="text-xs text-slate-600">Build your portfolio and preview an ATS-standard printable resume.</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
              >
                <FileText className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 saas-card p-5 space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Edit Information</h3>
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={builderData.name}
                    onChange={(e) => setBuilderData({...builderData, name: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email</label>
                    <input 
                      type="text" 
                      value={builderData.email}
                      onChange={(e) => setBuilderData({...builderData, email: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone</label>
                    <input 
                      type="text" 
                      value={builderData.phone}
                      onChange={(e) => setBuilderData({...builderData, phone: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Professional Summary</label>
                  <textarea 
                    rows={3}
                    value={builderData.summary}
                    onChange={(e) => setBuilderData({...builderData, summary: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Education</label>
                  <textarea 
                    rows={2}
                    value={builderData.education}
                    onChange={(e) => setBuilderData({...builderData, education: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skills (Comma-separated)</label>
                  <input 
                    type="text" 
                    value={builderData.skills}
                    onChange={(e) => setBuilderData({...builderData, skills: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Projects</label>
                  <textarea 
                    rows={3}
                    value={builderData.projects}
                    onChange={(e) => setBuilderData({...builderData, projects: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" 
                  />
                </div>
              </div>

              {/* Printable Live Preview */}
              <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print-area space-y-4 text-slate-900">
                <div className="border-b-2 border-slate-900 pb-3">
                  <h1 className="text-2xl font-black">{builderData.name}</h1>
                  <p className="text-xs text-slate-600 mt-1">{builderData.email} • {builderData.phone} • {builderData.city}</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">{builderData.links}</p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">Professional Summary</h3>
                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{builderData.summary}</p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">Education</h3>
                  <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-line">{builderData.education}</p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">Key Technical Skills</h3>
                  <p className="text-xs text-slate-700 mt-1.5">{builderData.skills}</p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">Projects</h3>
                  <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-line leading-relaxed">{builderData.projects}</p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">Experience</h3>
                  <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-line">{builderData.experience}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: RESUME ANALYZER (SCREEN 11 MATCHING MOCKUP)                */}
        {/* ================================================================ */}
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
            <div className="saas-card p-6">
              <h2 className="text-xl font-black text-slate-900">Resume Intelligence & ATS Analysis</h2>
              <p className="text-xs text-slate-600">Scan your resume keywords against real recruiter demand benchmarks.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 saas-card p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Input Resume Text</h3>
                <textarea
                  rows={8}
                  value={analyzerText}
                  onChange={(e) => setAnalyzerText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                />
                <button
                  onClick={() => setAnalyzerResult(analyzeResumeText(analyzerText, studentProfile.skills))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition"
                >
                  Analyze Resume Now
                </button>
              </div>

              {/* Analysis Results matching Screen 11 mockup */}
              <div className="lg:col-span-6 saas-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-base text-slate-900">Analysis Results</h3>
                    <p className="text-xs text-slate-500">ATS formatting and keyword matching</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600">{analyzerResult.score}%</span>
                    <span className="block text-[10px] text-emerald-600 font-bold">Good Quality</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Detected Skills ({analyzerResult.detectedSkills.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analyzerResult.detectedSkills.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-semibold border border-emerald-200">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">High-Demand Missing Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analyzerResult.missingSkills.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 bg-rose-50 text-rose-800 rounded-full text-[11px] font-semibold border border-rose-200">
                        + {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Top Recommendations</h4>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {analyzerResult.suggestions.map((sug, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: PRICING & SUBSCRIPTIONS (SCREEN 10 MATCHING MOCKUP)        */}
        {/* ================================================================ */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Affordable Student Career Plans</h2>
              <p className="text-xs text-slate-600">
                Priced fairly for Indian college students and freshers. No hidden renewal surprises.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="saas-card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Student Free</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">₹0</div>
                  <p className="text-xs text-slate-500 mt-1">Free forever for verified campus students</p>

                  <ul className="space-y-2 text-xs text-slate-600 mt-6">
                    <li className="flex items-center gap-2">✓ Browse all verified local jobs</li>
                    <li className="flex items-center gap-2">✓ Basic resume builder</li>
                    <li className="flex items-center gap-2">✓ Standard application tracker</li>
                    <li className="flex items-center gap-2">✓ Campus project collaborations</li>
                  </ul>
                </div>

                <button 
                  onClick={() => showToast('You are currently on the free Student Tier. You can upgrade anytime to Smart Plus for premium placement!', 'info')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
                >
                  Current Plan
                </button>
              </div>

              {/* Smart Plus Plan matching mockup */}
              <div className="saas-card p-6 flex flex-col justify-between space-y-4 border-2 border-blue-600 shadow-md relative">
                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                  Most Popular
                </span>

                <div>
                  <h3 className="font-bold text-base text-slate-900">Smart Plus Monthly</h3>
                  <div className="text-3xl font-black text-blue-600 mt-2">₹49 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                  <p className="text-xs text-slate-500 mt-1">Perfect for immediate campus placements</p>

                  <ul className="space-y-2 text-xs text-slate-600 mt-6">
                    <li className="flex items-center gap-2">✓ Full ATS Resume Scorer</li>
                    <li className="flex items-center gap-2">✓ Priority Recruiter Delivery</li>
                    <li className="flex items-center gap-2">✓ Real-time status update alerts</li>
                    <li className="flex items-center gap-2">✓ AI-powered skill gap analyzer</li>
                  </ul>
                </div>

                <button 
                  onClick={() => {
                    setSelectedPlanToBuy({ name: 'Smart Plus Monthly', price: 49, duration: '1 Month' });
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition"
                >
                  {hasSmartPlus ? 'Renew for ₹49' : 'Upgrade to Plus'}
                </button>
              </div>

              {/* Smart Pro Annual Plan */}
              <div className="saas-card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Smart Pro Annual</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">₹349 <span className="text-xs font-normal text-slate-500">/ yr</span></div>
                  <p className="text-xs text-slate-500 mt-1">Best value for undergraduate students</p>

                  <ul className="space-y-2 text-xs text-slate-600 mt-6">
                    <li className="flex items-center gap-2">✓ All Smart Plus benefits</li>
                    <li className="flex items-center gap-2">✓ Unlimited resume variations</li>
                    <li className="flex items-center gap-2">✓ Direct interview schedule sync</li>
                    <li className="flex items-center gap-2">✓ Early access to government gigs</li>
                  </ul>
                </div>

                <button 
                  onClick={() => {
                    setSelectedPlanToBuy({ name: 'Smart Pro Annual', price: 349, duration: '1 Year' });
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
                >
                  Upgrade for ₹349
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW: DEPLOY / EXPORT 3 FILES FOR INFINITYFREE                   */}
        {/* ================================================================ */}
        {activeTab === 'deploy' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="saas-card p-6 border-l-4 border-l-emerald-600">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">Download 3 Files for InfinityFree Hosting</h2>
              </div>
              <p className="text-xs text-slate-600">
                These 3 files in your root workspace provide the complete Core PHP 8+, MySQL PDO, and Bootstrap 5 application ready to upload to InfinityFree shared hosting.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <a 
                  href="/index.php" 
                  download="index.php"
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                >
                  <span>1. index.php</span>
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                </a>
                <a 
                  href="/admin.php" 
                  download="admin.php"
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                >
                  <span>2. admin.php</span>
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                </a>
                <a 
                  href="/database.sql" 
                  download="database.sql"
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                >
                  <span>3. database.sql</span>
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                </a>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="saas-card p-6 space-y-4">
              <h3 className="font-black text-base text-slate-900">InfinityFree 5-Minute Deployment Guide</h3>
              
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Step 1: Create an Account on InfinityFree</strong>
                  Sign up at <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">infinityfree.com</code> and create a free subdomain (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">yourname.infinityfreeapp.com</code>).
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Step 2: Create MySQL Database & Import database.sql</strong>
                  In your hosting cPanel, open <strong>MySQL Databases</strong>, create a database named <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">smart-local</code>, open phpMyAdmin, and click <strong>Import</strong> to upload <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">database.sql</code>.
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Step 3: Upload index.php and admin.php to htdocs</strong>
                  Open the online File Manager, navigate to the <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">htdocs</code> folder, and upload <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">index.php</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">admin.php</code>.
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Step 4: Access Your Live Site & Private Admin Panel</strong>
                  Visit your subdomain for the student platform. To log into your private admin suite, open <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/admin.php</code> with ID <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">admin@smartlocal.in</code> and Password <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Admin@SmartLocal2026!</code>.
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* INTERVIEW SCHEDULE MODAL                                       */}
      {/* ============================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Interview Schedule Details</h3>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-800 block">Junior Web Developer Interview</span>
                <span className="text-blue-700">Company: Innovatech Labs (Recruiter: Rohan Deshmukh)</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">Date & Time:</span>
                <p>Monday, 19 October 2026 at 10:00 AM IST</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">Meeting Link:</span>
                <p className="font-mono text-blue-600">https://meet.google.com/gighive-interview-demo</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">Preparation Checklist:</span>
                <p>• Have your React and Git portfolio ready.</p>
                <p>• Review component lifecycle and state management basics.</p>
              </div>
            </div>

            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Close & Ready
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* JOB DETAILS MODAL                                              */}
      {/* ============================================================== */}
      {activeJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-xl border border-slate-200 my-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">{activeJobModal.title}</h3>
                <p className="text-xs text-slate-600">{activeJobModal.companyName} • {activeJobModal.city}</p>
              </div>
              <button onClick={() => setActiveJobModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">About the Opportunity:</h4>
                <p>{activeJobModal.description}</p>
              </div>

              {activeJobModal.responsibilities && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Key Responsibilities:</h4>
                  <p className="whitespace-pre-line">{activeJobModal.responsibilities}</p>
                </div>
              )}

              {activeJobModal.qualifications && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Qualifications:</h4>
                  <p className="whitespace-pre-line">{activeJobModal.qualifications}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Required Skills:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeJobModal.skills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-full text-[11px] font-semibold">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsReportModalOpen(true);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Report Scam</span>
              </button>

              <button
                onClick={() => {
                  handleOpenApplyModal(activeJobModal);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs text-center"
              >
                Apply for this Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* APPLICATION SUBMISSION MODAL                                   */}
      {/* ============================================================== */}
      {isApplyingModalOpen && activeJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleApplySubmit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Submit Application</h3>
                <p className="text-xs text-slate-600">{activeJobModal.title} at {activeJobModal.companyName}</p>
              </div>
              <button type="button" onClick={() => setIsApplyingModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cover Note / Why You Fit</label>
                <textarea
                  rows={3}
                  value={applyCoverLetter}
                  onChange={(e) => setApplyCoverLetter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsApplyingModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Send Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCAM REPORT MODAL                                              */}
      {/* ============================================================== */}
      {isReportModalOpen && activeJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleReportSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Report Opportunity</h3>
                <p className="text-xs text-slate-600">{activeJobModal.title}</p>
              </div>
              <button type="button" onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="Demanding Payment or Fees">Demanding Payment or Security Deposit</option>
                  <option value="Unverified Recruiter Profile">Unverified Recruiter / Fake Company</option>
                  <option value="Misleading Job Description">Misleading Job Description</option>
                  <option value="Spam or Duplicate">Spam or Duplicate Listing</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Details</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context so our moderation team can inspect."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* SIMULATED RAZORPAY PAYMENT MODAL                               */}
      {/* ============================================================== */}
      {isPaymentModalOpen && selectedPlanToBuy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-lg text-slate-900">Razorpay Checkout</h3>
              <p className="text-xs text-slate-500 mt-0.5">Secure Payment Gateway</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Plan:</span>
                <strong className="text-slate-900">{selectedPlanToBuy.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <strong className="text-blue-600">₹{selectedPlanToBuy.price}</strong>
              </div>
              <div className="flex justify-between">
                <span>Currency:</span>
                <span>INR (₹)</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Confirm ₹{selectedPlanToBuy.price}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CREATE CAMPUS PROJECT MODAL                                    */}
      {/* ============================================================== */}
      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!newProjectTitle.trim()) return;
              const newProj: CampusProject = {
                id: Date.now(),
                title: newProjectTitle.trim(),
                owner: studentProfile.fullName,
                college: studentProfile.college || 'Engineering Institute',
                description: newProjectDesc.trim() || 'Peer collaboration campus project initiated on GigHive Local.',
                skills: newProjectSkills.split(',').map(s => s.trim()).filter(Boolean),
                teamSize: 3,
                openings: Number(newProjectOpenings) || 1,
                arrangement: newProjectArrangement,
                city: studentProfile.city,
                createdAt: new Date().toISOString().split('T')[0]
              };
              setCampusProjects([newProj, ...campusProjects]);
              setIsCreateProjectModalOpen(false);
              setNewProjectTitle('');
              setNewProjectDesc('');
              showToast('Campus project posted successfully to the collaboration board!', 'success');
            }}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Post a Campus Project</h3>
                <p className="text-slate-500">Find student co-builders and team collaborators</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateProjectModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. Smart Campus Food Delivery App"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Briefly describe what you are building and team goals..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work Arrangement</label>
                  <select
                    value={newProjectArrangement}
                    onChange={(e: any) => setNewProjectArrangement(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                    <option value="on-site">On-Site</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Open Positions</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newProjectOpenings}
                    onChange={(e) => setNewProjectOpenings(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Skills Needed (comma-separated)</label>
                <input
                  type="text"
                  value={newProjectSkills}
                  onChange={(e) => setNewProjectSkills(e.target.value)}
                  placeholder="React, Node.js, UI/UX, Python"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateProjectModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
              >
                Post Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* WITHDRAW APPLICATION CONFIRMATION MODAL                        */}
      {/* ============================================================== */}
      {withdrawingAppId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Withdraw Application?</h3>
              <p className="text-slate-500 mt-1">
                Are you sure you want to withdraw your submission? You can still browse other campus positions.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setWithdrawingAppId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Keep Active
              </button>
              <button
                onClick={() => confirmWithdrawApplication(withdrawingAppId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
              >
                Confirm Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECRET ADMIN GATEWAY & COMPREHENSIVE ADMINISTRATOR SUITE       */}
      {/* ============================================================== */}
      {isAdminGatewayOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
          {!adminAuthSuccess ? (
            /* Login Gate */
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-xs space-y-4 my-auto">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Administrator Security Portal</h3>
                    <p className="text-[11px] text-slate-500">Access Restricted • Verification Required</p>
                  </div>
                </div>
                <button onClick={() => setIsAdminGatewayOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              {/* Quick autofill helper */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-700">Demo Administrator Access</span>
                  {adminCopiedInfo && (
                    <span className="text-emerald-600 font-bold">✓ Copied!</span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
                  <div>ID: <strong className="text-slate-900 select-all">admin@smartlocal.in</strong></div>
                  <div>Pass: <strong className="text-slate-900 select-all">Admin@SmartLocal2026!</strong></div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminInputEmail('admin@smartlocal.in');
                    setAdminInputPassword('Admin@SmartLocal2026!');
                    setAdminAuthSuccess(true);
                  }}
                  className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] border border-blue-200"
                >
                  1-Click Autofill & Unlock
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanEmail = adminInputEmail.trim().toLowerCase();
                  if ((cleanEmail === 'admin@smartlocal.in' || cleanEmail === 'admin') && adminInputPassword === 'Admin@SmartLocal2026!') {
                    setAdminAuthSuccess(true);
                    setAdminLoginError(null);
                  } else {
                    setAdminLoginError('Invalid credentials. Use admin@smartlocal.in / Admin@SmartLocal2026! or click 1-Click Autofill.');
                  }
                }}
                className="space-y-3"
              >
                {adminLoginError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200">
                    {adminLoginError}
                  </div>
                )}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Admin Email</label>
                  <input
                    type="text"
                    value={adminInputEmail}
                    onChange={(e) => setAdminInputEmail(e.target.value)}
                    placeholder="admin@smartlocal.in"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password</label>
                  <input
                    type={adminShowPassword ? 'text' : 'password'}
                    value={adminInputPassword}
                    onChange={(e) => setAdminInputPassword(e.target.value)}
                    placeholder="Admin@SmartLocal2026!"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminGatewayOpen(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Log In
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Authenticated Admin Suite */
            <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-xs space-y-6 max-h-[92vh] overflow-y-auto">
              {/* Suite Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Administrator Command Suite</h2>
                    <p className="text-xs text-slate-500">
                      Logged in as <strong className="text-slate-900">admin@smartlocal.in</strong> • Private Security Gateway
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setAdminAuthSuccess(false);
                      setIsAdminGatewayOpen(false);
                    }}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition"
                  >
                    Lock & Log Out
                  </button>
                  <button onClick={() => setIsAdminGatewayOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
                </div>
              </div>

              {/* Sub-Tabs Navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
                <button
                  onClick={() => setAdminActiveSubTab('overview')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                    adminActiveSubTab === 'overview' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Overview & Analytics
                </button>
                <button
                  onClick={() => setAdminActiveSubTab('applications')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                    adminActiveSubTab === 'applications' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Candidates Pipeline ({applications.length})
                </button>
                <button
                  onClick={() => setAdminActiveSubTab('moderation')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                    adminActiveSubTab === 'moderation' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Job Listings ({jobs.length})
                </button>
                <button
                  onClick={() => setAdminActiveSubTab('recruiters')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                    adminActiveSubTab === 'recruiters' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Recruiter Verification
                </button>
                <button
                  onClick={() => setAdminActiveSubTab('ingestion')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                    adminActiveSubTab === 'ingestion' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Job Feeder
                </button>
                <button
                  onClick={() => setAdminActiveSubTab('reports')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                    adminActiveSubTab === 'reports' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Scam Reports ({jobReports.length})
                </button>
              </div>

              {/* Subtab 1: Overview & 7-Day Recharts Chart */}
              {adminActiveSubTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Live Jobs</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{jobs.length}</div>
                      <span className="text-[10px] text-emerald-600 font-semibold">100% Verified</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Total Applications</span>
                      <div className="text-2xl font-black text-blue-600 mt-1">{applications.length}</div>
                      <span className="text-[10px] text-slate-500">In Active Pipeline</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Employers</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">5</div>
                      <span className="text-[10px] text-slate-500">Campus Partners</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Scam Reports</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{jobReports.length}</div>
                      <span className="text-[10px] text-emerald-600 font-semibold">24h SLA Active</span>
                    </div>
                  </div>

                  {/* 7-Day Applications Chart using Recharts */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-slate-900">Applications Intake Over Last 7 Days</h4>
                        <p className="text-xs text-slate-500">Visualized via Recharts Area Trend</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-blue-600">{total7DayApps}</span>
                        <span className="block text-[10px] text-slate-500 font-semibold">Total Intake</span>
                      </div>
                    </div>

                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sevenDayAppStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35}/>
                              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="shortDate" stroke="#64748B" fontSize={11} />
                          <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '11px' }}
                            formatter={(val: any) => [`${val} Applications`, 'Received']}
                          />
                          <Area type="monotone" dataKey="applications" stroke="#2563EB" strokeWidth={2.5} fill="url(#appGradient)" dot={{ r: 4, fill: '#2563EB' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Candidates Pipeline & Decision Center */}
              {adminActiveSubTab === 'applications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900">Candidates Recruitment Pipeline</h3>
                    <div className="flex gap-1">
                      {(['all', 'under_review', 'interviewed', 'hired'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setAdminCandidateFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                            adminCandidateFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {f.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {applications
                      .filter(a => adminCandidateFilter === 'all' || a.status === adminCandidateFilter)
                      .map(app => (
                        <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{app.studentName}</span>
                              <span className="text-slate-500 font-mono text-[10px]">({app.studentEmail})</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                app.status === 'hired' ? 'bg-emerald-100 text-emerald-800' :
                                app.status === 'interviewed' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Applied for: <strong className="text-slate-800">{app.jobTitle}</strong> at <strong className="text-slate-800">{app.companyName}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {app.status === 'under_review' ? (
                              <>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'interviewed')}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px]"
                                >
                                  Invite to Interview 📅
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'hired')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px]"
                                >
                                  Extend Offer / Hire 🎉
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => updateApplicationStatus(app.id, 'under_review')}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-[10px] border border-slate-200"
                              >
                                Reset to Under Review 🔄
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Subtab 3: Job Listings Moderation */}
              {adminActiveSubTab === 'moderation' && (
                <div className="space-y-3">
                  <h3 className="font-black text-sm text-slate-900">Job Moderation Center</h3>
                  {jobs.map(job => (
                    <div key={job.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{job.title}</div>
                        <div className="text-[11px] text-slate-600">{job.companyName} • {job.city} • ₹{job.salaryMin} - ₹{job.salaryMax}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, isFeatured: !j.isFeatured } : j))}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                        >
                          {job.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtab 4: Recruiter Verification */}
              {adminActiveSubTab === 'recruiters' && (
                <div className="space-y-3">
                  <h3 className="font-black text-sm text-slate-900">Registered Recruiters</h3>
                  {[
                    { name: 'Innovatech Labs', lead: 'Rohan Deshmukh', city: 'Bengaluru', status: 'verified' },
                    { name: 'InsightAnalytics AI', lead: 'Sneha Patel', city: 'Hyderabad', status: 'verified' },
                    { name: 'EduSphere Studio', lead: 'Vikram Mehta', city: 'Pune', status: 'verified' }
                  ].map((rec, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-slate-900">{rec.name}</span>
                        <p className="text-[11px] text-slate-600">{rec.lead} • {rec.city}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                        ✓ Verified
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtab 5: Job Feeder */}
              {adminActiveSubTab === 'ingestion' && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-black text-sm text-slate-900">Automated Feeds & Apprenticeship Engine</h3>
                  <p className="text-xs text-slate-600">Sync fresh listings from National Apprenticeship Portal and campus partner feeds.</p>
                  <button
                    onClick={() => {
                      const sample = [{
                        recruiterName: 'Gov Tech Apprenticeships',
                        companyName: 'National Apprenticeship Hub',
                        title: 'Junior Linux Trainee',
                        description: 'Government backed apprenticeship for fresh graduates.',
                        category: 'Software Development',
                        skills: ['Linux', 'C', 'Git'],
                        jobType: 'internship' as const,
                        workArrangement: 'on-site' as const,
                        city: 'Bengaluru',
                        salaryMin: 14000,
                        salaryMax: 16000,
                        stipendType: 'range' as const,
                        openings: 5,
                        source: 'portal' as const,
                        isFeatured: true,
                        isVerified: true
                      }];
                      const res = ingestExternalFeed(jobs, sample);
                      setJobs(res.updatedList);
                      showToast(`Feed synced! Added ${res.importedCount} new listings from National Apprenticeship Portal.`, 'success');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Sync Live Feeds
                  </button>
                </div>
              )}

              {/* Subtab 6: Scam Reports */}
              {adminActiveSubTab === 'reports' && (
                <div className="space-y-3">
                  <h3 className="font-black text-sm text-slate-900">Student Scam Reports</h3>
                  {jobReports.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">No pending reports. Platform is clean!</div>
                  ) : (
                    jobReports.map(rep => (
                      <div key={rep.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-xs">{rep.jobTitle}</span>
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">{rep.reason}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic">&quot;{rep.details}&quot;</p>
                        <button
                          onClick={() => {
                            setJobReports(jobReports.filter(r => r.id !== rep.id));
                            showToast('Report marked as Resolved.', 'success');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold mt-1"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* FOOTER (CLEAN MODERN SAAS STYLE WITH DISCREET ADMIN GATEWAY)   */}
      {/* ============================================================== */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="small" />
          </div>

          <div className="text-center sm:text-right space-y-1">
            <p>© 2026 GigHive Local — Your Skills. Your City. Your Next Opportunity.</p>
            <div className="flex items-center justify-center sm:justify-end gap-3 text-[11px]">
              <button onClick={() => setActiveTab('deploy')} className="text-blue-600 hover:underline font-semibold">
                InfinityFree Setup Guide
              </button>
              <span>•</span>
              <button 
                onClick={() => setIsAdminGatewayOpen(true)}
                className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 transition"
                title="Private Administrator Gateway"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Gateway (Private)</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM NAVIGATION DOCK                                  */}
      {/* ============================================================== */}
      <div className="lg:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2 z-40">
        <div className="flex items-center justify-around text-center">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === 'home' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('find-jobs')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === 'find-jobs' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Find Jobs</span>
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === 'applications' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Applications</span>
          </button>
          <button 
            onClick={() => setActiveTab('resume-builder')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === 'resume-builder' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resume</span>
          </button>
        </div>
      </div>

    </div>
  );
}
