// Mock users with their credentials
export const mockUsers = [
  {
    uid: 'user1',
    name: 'Bogdan',
    email: 'bogdan@netbet.ro',
    password: 'password123',
    role: 'User'
  },
  {
    uid: 'user2',
    name: 'Razvan',
    email: 'razvan@netbet.ro',
    password: 'password123',
    role: 'User'
  },
  {
    uid: 'user3',
    name: 'Danela',
    email: 'danela@netbet.ro',
    password: 'password123',
    role: 'User'
  },
  {
    uid: 'user4',
    name: 'Doria',
    email: 'doria@netbet.ro',
    password: 'password123',
    role: 'User'
  },
    {
    uid: 'user4',
    name: 'Marean',
    email: 'marean@netbet.ro',
    password: 'password123',
    role: 'User'
  },
  {
    uid: 'admin1',
    name: 'Admin',
    email: 'admin@netbet.ro',
    password: 'admin123',
    role: 'Admin'
  }
];

// Mock tasks for each user
export const mockUserTasks = {
  user1: [
    {
      id: '1',
      jiraLink: 'https://jira.example.com/USER1-1',
      market: 'Market 1',
      department: 'Engineering',
      aiUsed: 'Yes',
      aiModel: 'GPT-4',
      timeUser: 2,
      timeAi: 0.5,
      taskType: 'LP',
      lpNumber: 3,
      createdAt: new Date(),
      isOldTask: 'Yes'
    }
  ],
  user2: [
    {
      id: '2',
      jiraLink: 'https://jira.example.com/USER2-1',
      market: 'Market 2',
      department: 'Marketing',
      aiUsed: 'No',
      timeUser: 1.5,
      taskType: 'Banners',
      bannerNumber: 5,
      createdAt: new Date(),
      isOldTask: 'No'
    }
  ],
  user3: [
    {
      id: '3',
      jiraLink: 'https://jira.example.com/USER3-1',
      market: 'Market 3',
      department: 'Sales',
      aiUsed: 'Yes',
      aiModel: 'Other',
      otherAiModel: 'Custom GPT',
      timeUser: 3,
      timeAi: 1,
      taskType: 'Misc',
      miscInfo: 'Sales presentation',
      createdAt: new Date(),
      isOldTask: 'Yes'
    }
  ],
  user4: [
    {
      id: '4',
      jiraLink: 'https://jira.example.com/USER4-1',
      market: 'Market 4',
      department: 'Product',
      aiUsed: 'Yes',
      aiModel: 'GPT-3',
      timeUser: 4,
      timeAi: 2,
      taskType: 'LP',
      lpNumber: 2,
      createdAt: new Date(),
      isOldTask: 'No'
    }
  ]
};
