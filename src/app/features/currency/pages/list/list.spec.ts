import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyList } from './list';

describe('CurrencyList', () => {
  let component: CurrencyList;
  let fixture: ComponentFixture<CurrencyList>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyList],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
