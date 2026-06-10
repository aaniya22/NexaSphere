export const fallbackCategories = [
  {
    id: 1,
    name: 'General',
    slug: 'general',
    description: 'General discussions about the club and community',
    icon: '💬',
    displayOrder: 1,
  },
  {
    id: 2,
    name: 'Events',
    slug: 'events',
    description: 'Questions and discussions about past and upcoming events',
    icon: '📅',
    displayOrder: 2,
  },
  {
    id: 3,
    name: 'Technical Help',
    slug: 'technical-help',
    description: 'Get help with technical issues, code, and projects',
    icon: '💻',
    displayOrder: 3,
  },
  {
    id: 4,
    name: 'Projects',
    slug: 'projects',
    description: 'Share and discuss community projects',
    icon: '🚀',
    displayOrder: 4,
  },
  {
    id: 5,
    name: 'Career',
    slug: 'career',
    description: 'Career advice, internships, and professional development',
    icon: '🎯',
    displayOrder: 5,
  },
];

export const fallbackThreads = [
  {
    id: 1,
    title: 'Welcome to the NexaSphere Forum!',
    content:
      'This is the official discussion forum for the NexaSphere community. Feel free to introduce yourself, ask questions, share your projects, and help others. Please follow the community guidelines and be respectful.',
    categoryId: 1,
    categoryName: 'General',
    categorySlug: 'general',
    authorName: 'NexaSphere Team',
    isPinned: true,
    isLocked: false,
    isAnswered: false,
    tags: ['welcome', 'introductions'],
    upvotes: 12,
    replyCount: 3,
    viewCount: 150,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'How do I contribute to open source projects?',
    content:
      'I am new to open source and want to start contributing. What are some good first steps? How do I find beginner-friendly issues?',
    categoryId: 4,
    categoryName: 'Projects',
    categorySlug: 'projects',
    authorName: 'NewContributor',
    isPinned: false,
    isLocked: false,
    isAnswered: true,
    tags: ['open-source', 'beginner'],
    upvotes: 8,
    replyCount: 5,
    viewCount: 89,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const fallbackReplies = [
  {
    id: 1,
    threadId: 1,
    content: 'Great to have this forum! Looking forward to engaging discussions.',
    authorName: 'Community Member',
    upvotes: 5,
    isAccepted: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
