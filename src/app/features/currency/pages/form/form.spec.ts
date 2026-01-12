import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyForm } from './form';

describe('CurrencyForm', () => {
  let component: CurrencyForm;
  let fixture: ComponentFixture<CurrencyForm>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
