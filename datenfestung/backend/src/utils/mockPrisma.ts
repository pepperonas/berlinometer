// Mock Prisma Client für Testing ohne echte Datenbank
export class MockPrismaClient {
  user = {
    findUnique: async (params: any) => {
      // Mock user für Testing
      if (params.where.email === 'test@datenfestung.com') {
        return {
          id: 1,
          email: 'test@datenfestung.com',
          passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8nzw4MRaUy', // "password123"
          firstName: 'Test',
          lastName: 'User',
          role: 'admin',
          organizationId: 1,
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: {
            id: 1,
            name: 'Test Organization',
          },
        };
      }
      
      // Admin user with admin/admin credentials
      if (params.where.email === 'admin') {
        return {
          id: 2,
          email: 'admin',
          passwordHash: '$2a$12$26LRVuf4e8fmEbbDVZk7S.T94fjN3SbJP0zJrdRdDzcp8qipKyCpm', // "admin"
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          organizationId: 1,
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: {
            id: 1,
            name: 'Test Organization',
          },
        };
      }
      return null;
    },
    
    create: async (params: any) => {
      return {
        id: Date.now(),
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: null,
      };
    },
    
    update: async (params: any) => {
      return {
        id: params.where.id,
        email: 'test@datenfestung.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        organizationId: 1,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: {
          id: 1,
          name: 'Test Organization',
        },
      };
    },
  };
  
  organization = {
    findUnique: async (params: any) => {
      return {
        id: 1,
        name: 'Test Organization',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  };
}

export const PrismaClient = MockPrismaClient;