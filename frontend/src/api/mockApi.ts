interface User {
  id: string;
  email: string;
  name: string;
}

// Mock user database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  },
];

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Validate email format
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password (for demo, just check if it's not empty)
  if (!password) {
    throw new Error('Password is required');
  }

  // For demo purposes, only allow login with test@example.com
  if (email !== 'test@example.com') {
    throw new Error('Invalid credentials');
  }

  return mockUsers[0];
};
