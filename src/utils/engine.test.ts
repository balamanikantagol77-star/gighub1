import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateMatchScore, 
  calculateDistanceKm, 
  analyzeResumeText, 
  filterJobs, 
  ingestExternalFeed,
  type JobItem
} from './engine.ts';

test('calculateMatchScore computes accurate overlap percentage', () => {
  const student = ['React', 'TypeScript', 'Tailwind CSS'];
  const job = ['React', 'JavaScript', 'Tailwind CSS', 'Git'];
  
  const score = calculateMatchScore(student, job);
  // 2 out of 4 matched => 50%
  assert.equal(score, 50);

  // High overlap
  const highMatch = calculateMatchScore(['React', 'Git', 'SQL'], ['React', 'Git']);
  assert.equal(highMatch, 100);

  // Low or empty overlap has baseline
  const lowMatch = calculateMatchScore([], ['C++', 'Rust']);
  assert.equal(lowMatch, 20);
});

test('calculateDistanceKm calculates approximate distance using Haversine', () => {
  // Bengaluru (12.9716, 77.5946) to Hyderabad (17.3850, 78.4867) is approx 500 km
  const dist = calculateDistanceKm(12.9716, 77.5946, 17.3850, 78.4867);
  assert.ok(dist !== null && dist > 480 && dist < 520, `Distance was ${dist}`);

  // Missing coordinate returns null
  assert.equal(calculateDistanceKm(undefined, 77.5, 12.9, 78.1), null);
});

test('analyzeResumeText detects skills, computes score and flags missing keywords', () => {
  const sampleResume = `
    Alex Johnson
    Education: B.Tech Computer Science from Bengaluru Tech University
    Skills: React, JavaScript, Node.js, SQL, Git
    Projects: Built campus portal using React and SQL, improving student access by 30%.
    Check code at github.com/alex-dev
  `;

  const result = analyzeResumeText(sampleResume);
  assert.ok(result.score >= 70, `Score was ${result.score}`);
  assert.ok(result.detectedSkills.includes('React'));
  assert.ok(result.detectedSkills.includes('SQL'));
  assert.ok(result.detectedSkills.includes('Git'));
  assert.ok(result.detectedSkills.includes('Node.js'));
  assert.ok(result.missingSkills.length > 0);
});

test('filterJobs filters and sorts jobs by criteria', () => {
  const mockJobs: JobItem[] = [
    {
      id: 1,
      companyName: 'Acme',
      title: 'React Intern',
      description: 'Web development',
      category: 'Software Development',
      skills: ['React'],
      jobType: 'internship',
      workArrangement: 'remote',
      city: 'Bengaluru',
      salaryMin: 10000,
      salaryMax: 15000,
      stipendType: 'range',
      openings: 1,
      source: 'recruiter',
      moderationStatus: 'approved',
      isFeatured: false,
      isVerified: true,
      viewsCount: 10,
      createdAt: '2026-01-01'
    },
    {
      id: 2,
      companyName: 'Beta Corp',
      title: 'Python Analyst',
      description: 'Data analytics',
      category: 'Data Science & Analytics',
      skills: ['Python', 'SQL'],
      jobType: 'part-time',
      workArrangement: 'on-site',
      city: 'Pune',
      salaryMin: 5000,
      salaryMax: 8000,
      stipendType: 'range',
      openings: 2,
      source: 'recruiter',
      moderationStatus: 'approved',
      isFeatured: true,
      isVerified: false,
      viewsCount: 5,
      createdAt: '2026-01-02'
    }
  ];

  // Search by query
  const res1 = filterJobs(mockJobs, { query: 'React' });
  assert.equal(res1.length, 1);
  assert.equal(res1[0].id, 1);

  // Filter by arrangement
  const res2 = filterJobs(mockJobs, { workArrangement: 'on-site' });
  assert.equal(res2.length, 1);
  assert.equal(res2[0].id, 2);

  // Filter by city
  const res3 = filterJobs(mockJobs, { city: 'Bengaluru' });
  assert.equal(res3.length, 1);
});

test('ingestExternalFeed deduplicates and adds fresh opportunities', () => {
  const existing: JobItem[] = [
    {
      id: 1,
      companyName: 'Alpha Tech',
      title: 'React Intern',
      description: 'Web development',
      category: 'Software Development',
      skills: ['React'],
      jobType: 'internship',
      workArrangement: 'remote',
      city: 'Bengaluru',
      salaryMin: 10000,
      salaryMax: 15000,
      stipendType: 'range',
      openings: 1,
      source: 'api_feed',
      moderationStatus: 'approved',
      isFeatured: false,
      isVerified: true,
      viewsCount: 10,
      createdAt: '2026-01-01'
    }
  ];

  const incoming = [
    // Duplicate of existing
    {
      companyName: 'Alpha Tech',
      title: 'React Intern',
      description: 'Web dev',
      category: 'Software Development',
      skills: ['React'],
      jobType: 'internship' as const,
      workArrangement: 'remote' as const,
      city: 'Bengaluru',
      salaryMin: 10000,
      salaryMax: 15000,
      stipendType: 'range' as const,
      openings: 1,
      source: 'api_feed',
      isFeatured: false,
      isVerified: true
    },
    // New item
    {
      companyName: 'Delta Labs',
      title: 'Flutter Trainee',
      description: 'Mobile apps',
      category: 'Software Development',
      skills: ['Flutter'],
      jobType: 'internship' as const,
      workArrangement: 'hybrid' as const,
      city: 'Hyderabad',
      salaryMin: 12000,
      salaryMax: 16000,
      stipendType: 'range' as const,
      openings: 3,
      source: 'api_feed',
      isFeatured: false,
      isVerified: true
    }
  ];

  const { updatedList, importedCount, duplicateCount } = ingestExternalFeed(existing, incoming);
  assert.equal(duplicateCount, 1);
  assert.equal(importedCount, 1);
  assert.equal(updatedList.length, 2);
  assert.equal(updatedList[0].title, 'Flutter Trainee');
});
