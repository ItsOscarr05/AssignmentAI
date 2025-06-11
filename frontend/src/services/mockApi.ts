// Mock user data
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'student',
};

// Mock auth service
export const mockAuth = {
  login: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock authentication
    if (email === 'test@example.com' && password === 'password') {
      const token = 'mock-jwt-token';
      return { token, user: mockUser };
    }

    throw new Error('Invalid credentials');
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const token = 'mock-jwt-token';
    return {
      token,
      user: {
        ...mockUser,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      },
    };
  },

  logout: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  getCurrentUser: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockUser;
  },
};
