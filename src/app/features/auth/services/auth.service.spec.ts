import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError, firstValueFrom } from 'rxjs';
import { AuthService, LoginRequest, LoginResponse, User } from './auth.service';
import { ConfigService } from '@core/services/config.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: any;
  let routerMock: any;
  let configMock: any;
  let tokenServiceMock: any;

  const mockUser: User = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
  };

  const mockLoginResponse: LoginResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
    expiresIn: 3600,
  };

  const mockCredentials: LoginRequest = {
    username: 'testuser',
    password: 'password123',
  };

  beforeEach(() => {
    httpMock = {
      post: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    configMock = {
      authConfig: {
        tokenKey: 'authToken',
        userKey: 'authUser',
      },
      authEndpoints: {
        login: '/auth/login',
        refresh: '/auth/refresh',
      },
      buildApiUrl: vi.fn((endpoint: string) => `http://api.test${endpoint}`),
    };

    tokenServiceMock = {
      isTokenExpired: vi.fn().mockReturnValue(false),
      isValidToken: vi.fn().mockReturnValue(true),
    };

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpMock },
        { provide: Router, useValue: routerMock },
        { provide: ConfigService, useValue: configMock },
        { provide: TokenService, useValue: tokenServiceMock },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with no authentication when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('login', () => {
    it('should call login endpoint with credentials', async () => {
      httpMock.post.mockReturnValue(of(mockLoginResponse));

      const response = await firstValueFrom(service.login(mockCredentials));
      expect(httpMock.post).toHaveBeenCalledWith('http://api.test/auth/login', mockCredentials);
      expect(response).toEqual(mockLoginResponse);
    });

    it('should store token and user on successful login', async () => {
      httpMock.post.mockReturnValue(of(mockLoginResponse));

      await firstValueFrom(service.login(mockCredentials));
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('authUser', JSON.stringify(mockUser));
    });

    it('should update auth state on successful login', async () => {
      httpMock.post.mockReturnValue(of(mockLoginResponse));

      await firstValueFrom(service.login(mockCredentials));
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
    });

    it('should handle login errors', async () => {
      const error = new Error('Login failed');
      httpMock.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.login(mockCredentials))).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('should clear auth data from localStorage', () => {
      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authUser');
    });

    it('should update auth state to unauthenticated', () => {
      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('should navigate to login page', () => {
      service.logout();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return stored token', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('stored-token');
      expect(service.getToken()).toBe('stored-token');
    });

    it('should handle localStorage errors', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return null when no user is stored', () => {
      expect(service.getUser()).toBeNull();
    });

    it('should return stored user when token is valid', async () => {
      httpMock.post.mockReturnValue(of(mockLoginResponse));
      await firstValueFrom(service.login(mockCredentials));

      expect(service.getUser()).toEqual(mockUser);
    });

    it('should logout and return null when token is expired', async () => {
      httpMock.post.mockReturnValue(of(mockLoginResponse));
      await firstValueFrom(service.login(mockCredentials));

      tokenServiceMock.isTokenExpired.mockReturnValue(true);

      expect(service.getUser()).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('getUserId', () => {
    it('should return 0 when no user is authenticated', () => {
      expect(service.getUserId()).toBe(0);
    });

    it('should return user ID when authenticated', async () => {
      httpMock.post.mockReturnValue(of(mockLoginResponse));
      await firstValueFrom(service.login(mockCredentials));

      expect(service.getUserId()).toBe(123);
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when not authenticated', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when authenticated', async () => {
      httpMock.post.mockReturnValue(of(mockLoginResponse));
      await firstValueFrom(service.login(mockCredentials));

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should call refresh endpoint with refresh token', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('stored-refresh-token');
      httpMock.post.mockReturnValue(of(mockLoginResponse));

      const response = await firstValueFrom(service.refreshToken());
      expect(httpMock.post).toHaveBeenCalledWith('http://api.test/auth/refresh', {
        refreshToken: 'stored-refresh-token',
      });
      expect(response).toEqual(mockLoginResponse);
    });

    it('should return error when no refresh token exists', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      await expect(firstValueFrom(service.refreshToken())).rejects.toThrow(
        'No refresh token available',
      );
    });

    it('should logout on refresh failure', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('stored-refresh-token');
      const error = new Error('Refresh failed');
      httpMock.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.refreshToken())).rejects.toThrow();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should update tokens on successful refresh', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('stored-refresh-token');
      httpMock.post.mockReturnValue(of(mockLoginResponse));

      await firstValueFrom(service.refreshToken());
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
    });
  });

  describe('authState observable', () => {
    it('should emit initial auth state', async () => {
      const state = await firstValueFrom(service.authState);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('localStorage error handling', () => {
    it('should handle setItem errors gracefully', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      httpMock.post.mockReturnValue(of(mockLoginResponse));

      await firstValueFrom(service.login(mockCredentials));
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle getItem errors when retrieving user', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(service.getUser()).toBeNull();
    });

    it('should handle removeItem errors during logout', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => service.logout()).not.toThrow();
    });
  });
});
