import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let localStorageMock: Record<string, string>;
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let removeItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};

    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return localStorageMock[key] || null;
    });

    setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key: string, value: string) => {
        localStorageMock[key] = value;
      });

    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete localStorageMock[key];
    });

    service = new TokenService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setToken', () => {
    it('should store token in localStorage', () => {
      const token = 'test-token-123';

      service.setToken(token);

      expect(setItemSpy).toHaveBeenCalledWith('bills_tracker_token', token);
      expect(localStorageMock['bills_tracker_token']).toBe(token);
    });

    it('should handle storage errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      setItemSpy.mockImplementation(() => {
        throw new Error('Storage full');
      });

      service.setToken('token');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error storing token:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getToken', () => {
    it('should retrieve token from localStorage', () => {
      localStorageMock['bills_tracker_token'] = 'stored-token';

      const token = service.getToken();

      expect(token).toBe('stored-token');
      expect(getItemSpy).toHaveBeenCalledWith('bills_tracker_token');
    });

    it('should return null when no token exists', () => {
      const token = service.getToken();

      expect(token).toBeNull();
    });

    it('should handle storage errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      getItemSpy.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const token = service.getToken();

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting token:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeToken', () => {
    it('should remove token from localStorage', () => {
      localStorageMock['bills_tracker_token'] = 'token-to-remove';

      service.removeToken();

      expect(removeItemSpy).toHaveBeenCalledWith('bills_tracker_token');
      expect(localStorageMock['bills_tracker_token']).toBeUndefined();
    });

    it('should handle removal errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      removeItemSpy.mockImplementation(() => {
        throw new Error('Cannot remove');
      });

      service.removeToken();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error removing token:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      // JWT con payload: {"sub":"123","username":"testuser","email":"test@example.com","roles":["user"],"iat":1234567890,"exp":9999999999}
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOlsidXNlciJdLCJpYXQiOjEyMzQ1Njc4OTAsImV4cCI6OTk5OTk5OTk5OX0.fakesignature';

      const payload = service.decodeToken(validToken);

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe('123');
      expect(payload?.username).toBe('testuser');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.roles).toEqual(['user']);
    });

    it('should use stored token if no token parameter provided', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjk5OTk5OTk5OTl9.fakesig';
      localStorageMock['bills_tracker_token'] = token;

      const payload = service.decodeToken();

      expect(payload).toBeDefined();
      expect(payload?.username).toBe('testuser');
    });

    it('should return null for invalid JWT format', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const invalidToken = 'not.a.valid.jwt.token';

      const payload = service.decodeToken(invalidToken);

      expect(payload).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid JWT format');

      consoleErrorSpy.mockRestore();
    });

    it('should return null when no token exists', () => {
      const payload = service.decodeToken();

      expect(payload).toBeNull();
    });

    it('should handle decode errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const malformedToken = 'header.invalid-base64!@#$.signature';

      const payload = service.decodeToken(malformedToken);

      expect(payload).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error decoding token:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Token que expira en el futuro (año 2999)
      const futureToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MzI1MDM2ODAwMDB9.sig';

      const isExpired = service.isTokenExpired(futureToken);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      // Token que expiró en el pasado (año 2020)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE1MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMH0.sig';

      const isExpired = service.isTokenExpired(expiredToken);

      expect(isExpired).toBe(true);
    });

    it('should return true when token cannot be decoded', () => {
      const isExpired = service.isTokenExpired('invalid-token');

      expect(isExpired).toBe(true);
    });

    it('should use stored token if no parameter provided', () => {
      const futureToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MzI1MDM2ODAwMDB9.sig';
      localStorageMock['bills_tracker_token'] = futureToken;

      const isExpired = service.isTokenExpired();

      expect(isExpired).toBe(false);
    });
  });

  describe('getTokenExpirationDate', () => {
    it('should return expiration date for valid token', () => {
      // Token con exp: 1700000000 (Nov 14, 2023)
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMH0.sig';

      const expirationDate = service.getTokenExpirationDate(token);

      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate?.getTime()).toBe(1700000000 * 1000);
    });

    it('should return null for invalid token', () => {
      const expirationDate = service.getTokenExpirationDate('invalid-token');

      expect(expirationDate).toBeNull();
    });

    it('should use stored token if no parameter provided', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMH0.sig';
      localStorageMock['bills_tracker_token'] = token;

      const expirationDate = service.getTokenExpirationDate();

      expect(expirationDate).toBeInstanceOf(Date);
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return time remaining for non-expired token', () => {
      // Token que expira 1 hora en el futuro
      const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600;
      const payload = {
        sub: '123',
        username: 'test',
        iat: Math.floor(Date.now() / 1000),
        exp: oneHourFromNow,
      };
      const token = `header.${btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')}.signature`;

      const timeRemaining = service.getTimeUntilExpiration(token);

      // Debe ser aproximadamente 3600000ms (1 hora)
      expect(timeRemaining).toBeGreaterThan(3590000);
      expect(timeRemaining).toBeLessThanOrEqual(3600000);
    });

    it('should return 0 for expired token', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE1MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMH0.sig';

      const timeRemaining = service.getTimeUntilExpiration(expiredToken);

      expect(timeRemaining).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      const timeRemaining = service.getTimeUntilExpiration('invalid-token');

      expect(timeRemaining).toBe(0);
    });
  });

  describe('isValidToken', () => {
    it('should return true for valid non-expired token', () => {
      const futureToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MzI1MDM2ODAwMDB9.sig';

      const isValid = service.isValidToken(futureToken);

      expect(isValid).toBe(true);
    });

    it('should return false for expired token', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE1MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMH0.sig';

      const isValid = service.isValidToken(expiredToken);

      expect(isValid).toBe(false);
    });

    it('should return false for invalid token', () => {
      const isValid = service.isValidToken('invalid-token');

      expect(isValid).toBe(false);
    });

    it('should return false when no token exists', () => {
      const isValid = service.isValidToken();

      expect(isValid).toBe(false);
    });

    it('should use stored token if no parameter provided', () => {
      const futureToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MzI1MDM2ODAwMDB9.sig';
      localStorageMock['bills_tracker_token'] = futureToken;

      const isValid = service.isValidToken();

      expect(isValid).toBe(true);
    });
  });

  describe('getUserFromToken', () => {
    it('should extract user info from token', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOlsidXNlciIsImFkbWluIl0sImlhdCI6MTIzNDU2Nzg5MCwiZXhwIjo5OTk5OTk5OTk5fQ.sig';

      const user = service.getUserFromToken(token);

      expect(user).toBeDefined();
      expect(user?.id).toBe('123');
      expect(user?.username).toBe('testuser');
      expect(user?.email).toBe('test@example.com');
      expect(user?.roles).toEqual(['user', 'admin']);
    });

    it('should return null for invalid token', () => {
      const user = service.getUserFromToken('invalid-token');

      expect(user).toBeNull();
    });

    it('should use stored token if no parameter provided', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjk5OTk5OTk5OTl9.sig';
      localStorageMock['bills_tracker_token'] = token;

      const user = service.getUserFromToken();

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should handle token without optional fields', () => {
      // Token sin email y roles
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjk5OTk5OTk5OTl9.sig';

      const user = service.getUserFromToken(token);

      expect(user).toBeDefined();
      expect(user?.id).toBe('123');
      expect(user?.username).toBe('testuser');
      expect(user?.email).toBeUndefined();
      expect(user?.roles).toBeUndefined();
    });
  });
});
