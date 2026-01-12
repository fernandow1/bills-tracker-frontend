import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopForm } from './form';

describe('ShopForm', () => {
  let component: ShopForm;
  let fixture: ComponentFixture<ShopForm>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
