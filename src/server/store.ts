import crypto from 'crypto';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'student' | 'recruiter' | 'admin';
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
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
  resumeUrl?: string;
  hasSmartPlus?: boolean;
}

export interface RecruiterProfile {
  id: number;
  userId: number;
  recruiterName: string;
  companyName: string;
  website?: string;
  phone?: string;
  location: string;
  description?: string;
  cinGst?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: string;
}

export interface JobRecord {
  id: number;
  recruiterId: number;
  recruiterName: string;
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

export interface ApplicationRecord {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentCollege?: string;
  studentSkills: string[];
  coverLetter?: string;
  resumeUrl?: string;
  status: 'applied' | 'under_review' | 'interviewed' | 'hired' | 'rejected' | 'withdrawn';
  appliedAt: string;
  interviewSchedule?: {
    date: string;
    time: string;
    meetLink: string;
    notes?: string;
  };
}

export interface JobReport {
  id: number;
  jobId: number;
  jobTitle: string;
  reporter: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  actorEmail: string;
  actorRole: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SessionData {
  token: string;
  userId: number;
  email: string;
  role: 'student' | 'recruiter' | 'admin';
  expiresAt: number;
}

// Password hashing with crypto pbkdf2
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return computed === hash;
}

class MemoryStore {
  users: User[] = [];
  studentProfiles: StudentProfile[] = [];
  recruiterProfiles: RecruiterProfile[] = [];
  jobs: JobRecord[] = [];
  applications: ApplicationRecord[] = [];
  savedJobs: { studentId: number; jobId: number; savedAt: string }[] = [];
  jobReports: JobReport[] = [];
  auditLogs: AuditLog[] = [];
  sessions: Map<string, SessionData> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Admin User
    const adminPass = hashPassword('Admin@SmartLocal2026!');
    this.users.push({
      id: 1,
      email: 'admin@smartlocal.in',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      role: 'admin',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z'
    });

    // 2. Student User (Alex Rivero)
    const studentPass = hashPassword('Student@2026!');
    this.users.push({
      id: 2,
      email: 'alex.student@smartlocal.in',
      passwordHash: studentPass.hash,
      salt: studentPass.salt,
      role: 'student',
      status: 'active',
      createdAt: '2026-10-05T00:00:00Z'
    });

    this.studentProfiles.push({
      id: 1,
      userId: 2,
      fullName: 'Alex Rivero',
      email: 'alex.student@smartlocal.in',
      phone: '+91 98450 12345',
      city: 'Bengaluru',
      locality: 'Koramangala 4th Block',
      college: 'School of Technology & Design',
      course: 'B.Tech in Computer Science',
      graduationYear: 2026,
      skills: ['React', 'JavaScript', 'Tailwind CSS', 'SQL', 'Git', 'Figma', 'UI Design', 'Python'],
      latitude: 12.9352,
      longitude: 77.6245,
      bio: 'Enthusiastic undergraduate developer passionate about front-end interfaces, campus tools, and reactive systems.',
      hasSmartPlus: true
    });

    // 3. Recruiter 1: Rohan Deshmukh (Innovatech Labs)
    const rec1Pass = hashPassword('Recruiter@2026!');
    this.users.push({
      id: 3,
      email: 'rohan@innovatech.in',
      passwordHash: rec1Pass.hash,
      salt: rec1Pass.salt,
      role: 'recruiter',
      status: 'active',
      createdAt: '2026-10-02T00:00:00Z'
    });

    this.recruiterProfiles.push({
      id: 101,
      userId: 3,
      recruiterName: 'Rohan Deshmukh',
      companyName: 'Innovatech Labs',
      website: 'https://innovatech-labs.example.com',
      phone: '+91 80 4123 4567',
      location: 'Bengaluru, Karnataka',
      description: 'Engineering lab creating agile campus development tools and micro-SaaS applications.',
      cinGst: '29ABCDE1234F1Z5',
      verificationStatus: 'verified',
      verificationNotes: 'Verified via Corporate Ministry Registration and corporate email domain.',
      verifiedAt: '2026-10-03T10:00:00Z'
    });

    // 4. Recruiter 2: Sneha Patel (InsightAnalytics AI)
    const rec2Pass = hashPassword('Recruiter@2026!');
    this.users.push({
      id: 4,
      email: 'sneha@insightanalytics.ai',
      passwordHash: rec2Pass.hash,
      salt: rec2Pass.salt,
      role: 'recruiter',
      status: 'active',
      createdAt: '2026-10-03T00:00:00Z'
    });

    this.recruiterProfiles.push({
      id: 102,
      userId: 4,
      recruiterName: 'Sneha Patel',
      companyName: 'InsightAnalytics AI',
      website: 'https://insightanalytics.example.com',
      phone: '+91 40 2345 6789',
      location: 'HITEC City, Hyderabad',
      description: 'Data analytics & AI consultancy delivering automated visual dashboards and enterprise insights.',
      cinGst: '36AABCI5678K1Z2',
      verificationStatus: 'verified',
      verificationNotes: 'Company GST and LinkedIn presence validated.',
      verifiedAt: '2026-10-04T11:30:00Z'
    });

    // 5. Recruiter 3: Vikram Mehta (EduSphere Studio - Pending Verification)
    const rec3Pass = hashPassword('Recruiter@2026!');
    this.users.push({
      id: 5,
      email: 'vikram@edusphere.io',
      passwordHash: rec3Pass.hash,
      salt: rec3Pass.salt,
      role: 'recruiter',
      status: 'active',
      createdAt: '2026-10-08T00:00:00Z'
    });

    this.recruiterProfiles.push({
      id: 103,
      userId: 5,
      recruiterName: 'Vikram Mehta',
      companyName: 'EduSphere Studio',
      website: 'https://edusphere.example.com',
      phone: '+91 20 6789 0123',
      location: 'FC Road, Pune',
      description: 'Design and educational media agency training undergraduates in UX design and animations.',
      cinGst: '27AABCE9876L1Z8',
      verificationStatus: 'pending',
      verificationNotes: 'Submitted for verification on 12 Oct 2026. Awaiting admin review.'
    });

    // Seed Jobs
    this.jobs.push(
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
        viewsCount: 245,
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
        viewsCount: 168,
        createdAt: '2026-10-11'
      },
      {
        id: 3,
        recruiterId: 103,
        recruiterName: 'Vikram Mehta',
        companyName: 'EduSphere Studio',
        title: 'Graphic Design & UI Gig',
        description: 'Short 4-week freelance contract to create fresh mobile UI mockups, icons, and student orientation banners.',
        responsibilities: '• Design mobile wireframes in Figma\n• Create vector illustrations and social media banners\n• Export production SVG assets',
        qualifications: 'Strong portfolio in Figma, Canva, or Adobe Illustrator. Prior student club design experience preferred.',
        category: 'Design & Creative',
        skills: ['Figma', 'UI Design', 'Wireframing', 'Canva'],
        jobType: 'freelance',
        workArrangement: 'remote',
        city: 'Pune',
        locality: 'Shivajinagar',
        latitude: 18.5314,
        longitude: 73.8446,
        salaryMin: 8000,
        salaryMax: 12000,
        stipendType: 'fixed',
        duration: '1 Month',
        openings: 1,
        deadline: '2026-11-05',
        source: 'recruiter',
        moderationStatus: 'approved',
        isFeatured: false,
        isVerified: false,
        viewsCount: 94,
        createdAt: '2026-10-12'
      },
      {
        id: 4,
        recruiterId: 101,
        recruiterName: 'Rohan Deshmukh',
        companyName: 'GreenTech Innovations',
        title: 'Campus IoT Energy Monitoring Project',
        description: 'Hands-on hardware & web telemetry project. Deploy ESP32 power monitors and stream readings over MQTT to a live dashboard.',
        responsibilities: '• Wire microcontroller circuit boards\n• Code telemetry firmware in C++/Arduino\n• Connect real-time WebSocket feeds to React frontend',
        qualifications: 'Students in ECE/EEE or Computer Engineering. Hands-on interest in IoT protocols.',
        category: 'College Projects',
        skills: ['IoT', 'Arduino', 'ESP32', 'C++', 'MQTT'],
        jobType: 'project',
        workArrangement: 'on-site',
        city: 'Bengaluru',
        locality: 'Electronic City Phase 1',
        latitude: 12.8399,
        longitude: 77.6770,
        salaryMin: 14000,
        salaryMax: 16000,
        stipendType: 'range',
        duration: '4 Months',
        openings: 4,
        deadline: '2026-11-25',
        source: 'recruiter',
        moderationStatus: 'approved',
        isFeatured: true,
        isVerified: true,
        viewsCount: 201,
        createdAt: '2026-10-13'
      },
      {
        id: 5,
        recruiterId: 102,
        recruiterName: 'Sneha Patel',
        companyName: 'CampusPulse Media',
        title: 'Content Writing & Social Media Intern',
        description: 'Help scale our campus community newsletter and LinkedIn content for freshers looking for tech roles.',
        responsibilities: '• Write 3 technical blog posts weekly\n• Manage LinkedIn polls and Twitter updates\n• Interview placed alumni for career advice',
        qualifications: 'Excellent written English, grasp of modern tech keywords, and active presence on tech LinkedIn.',
        category: 'Marketing & Content',
        skills: ['Content Writing', 'SEO', 'Social Media', 'Communication'],
        jobType: 'part-time',
        workArrangement: 'remote',
        city: 'Delhi',
        locality: 'Connaught Place',
        latitude: 28.6315,
        longitude: 77.2167,
        salaryMin: 6000,
        salaryMax: 9000,
        stipendType: 'range',
        duration: '2 Months',
        openings: 2,
        deadline: '2026-11-10',
        source: 'recruiter',
        moderationStatus: 'approved',
        isFeatured: false,
        isVerified: true,
        viewsCount: 138,
        createdAt: '2026-10-14'
      },
      {
        id: 6,
        recruiterId: 101,
        recruiterName: 'Rohan Deshmukh',
        companyName: 'CloudMatrix Technologies',
        title: 'Remote Python Backend Trainee',
        description: 'Work with cloud microservices, REST APIs with FastAPI, and relational database migrations with PostgreSQL.',
        responsibilities: '• Build modular endpoints in FastAPI\n• Write SQL schema migrations and automated unit tests\n• Deploy Docker microservices to AWS App Runner',
        qualifications: 'Solid grasp of Python data structures, SQL queries, and basic Git teamwork.',
        category: 'Software Development',
        skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS'],
        jobType: 'internship',
        workArrangement: 'remote',
        city: 'Bengaluru',
        locality: 'Indiranagar',
        latitude: 12.9784,
        longitude: 77.6408,
        salaryMin: 15000,
        salaryMax: 22000,
        stipendType: 'range',
        duration: '6 Months',
        openings: 3,
        deadline: '2026-11-30',
        source: 'recruiter',
        moderationStatus: 'approved',
        isFeatured: true,
        isVerified: true,
        viewsCount: 312,
        createdAt: '2026-10-09'
      }
    );

    // Seed Applications
    this.applications.push(
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
        coverLetter: 'Built multiple college portals and responsive React applications with high component reusability.',
        status: 'interviewed',
        appliedAt: '2026-10-12',
        interviewSchedule: {
          date: '2026-10-19',
          time: '10:00 AM IST',
          meetLink: 'https://meet.google.com/smart-local-interview-demo',
          notes: 'Technical Interview Round 1 (React & Git)'
        }
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
    );

    // Seed Saved Jobs
    this.savedJobs.push(
      { studentId: 1, jobId: 1, savedAt: '2026-10-10' },
      { studentId: 1, jobId: 2, savedAt: '2026-10-11' },
      { studentId: 1, jobId: 6, savedAt: '2026-10-12' }
    );

    // Seed Scam Report
    this.jobReports.push({
      id: 1,
      jobId: 4,
      jobTitle: 'Campus IoT Energy Monitoring Project',
      reporter: 'alex.student@smartlocal.in',
      reason: 'Unverified Recruiter Profile',
      details: 'Please verify the hardware mentor credentials and campus safety standards.',
      status: 'pending',
      createdAt: '2026-10-15 14:20'
    });

    // Seed Audit Logs
    this.auditLogs.push(
      {
        id: 1,
        action: 'SYSTEM_BOOTSTRAP',
        actorEmail: 'system@smartlocal.in',
        actorRole: 'system',
        details: 'Smart Local Core Database & Security Engine initialized successfully with AWS readiness profiles.',
        timestamp: '2026-10-01T00:00:00Z'
      },
      {
        id: 2,
        action: 'RECRUITER_VERIFIED',
        actorEmail: 'admin@smartlocal.in',
        actorRole: 'admin',
        details: 'Innovatech Labs verified after corporate CIN documentation check.',
        timestamp: '2026-10-03T10:00:00Z'
      },
      {
        id: 3,
        action: 'JOB_APPROVED',
        actorEmail: 'admin@smartlocal.in',
        actorRole: 'admin',
        details: 'Approved job #1 "Junior Web Developer" from verified employer.',
        timestamp: '2026-10-10T12:00:00Z'
      }
    );
  }

  // Session Management
  createSession(user: User): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessions.set(token, {
      token,
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt
    });
    return token;
  }

  validateSession(token?: string): SessionData | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  destroySession(token: string): boolean {
    return this.sessions.delete(token);
  }

  // Audit Log Entry
  logAudit(action: string, actorEmail: string, actorRole: string, details: string, ipAddress = '127.0.0.1') {
    const log: AuditLog = {
      id: this.auditLogs.length + 1,
      action,
      actorEmail,
      actorRole,
      details,
      ipAddress,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
  }
}

export const store = new MemoryStore();
