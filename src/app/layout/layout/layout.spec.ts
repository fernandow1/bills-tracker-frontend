import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaMatcher } from '@angular/cdk/layout';
import { By } from '@angular/platform-browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Layout } from './layout';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;
  let mockMediaMatcher: any;
  let mockMediaQueryList: any;

  beforeEach(async () => {
    // Mock MediaQueryList with Vitest
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock MediaMatcher with Vitest
    mockMediaMatcher = {
      matchMedia: vi.fn().mockReturnValue(mockMediaQueryList),
    };

    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [
        { provide: MediaMatcher, useValue: mockMediaMatcher },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: { params: {} },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-toolbar', () => {
    const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
    expect(toolbar).toBeTruthy();
  });

  it('should render mat-sidenav-container', () => {
    const sidenavContainer = fixture.debugElement.query(By.css('mat-sidenav-container'));
    expect(sidenavContainer).toBeTruthy();
  });

  it('should render mat-sidenav', () => {
    const sidenav = fixture.debugElement.query(By.css('mat-sidenav'));
    expect(sidenav).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });

  it('should initialize MediaMatcher correctly', () => {
    expect(mockMediaMatcher.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
});
