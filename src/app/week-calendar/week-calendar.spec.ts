import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { WeekCalendarComponent } from './week-calendar';

describe('WeekCalendarComponent', () => {
  let component: WeekCalendarComponent;
  let fixture: ComponentFixture<WeekCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekCalendarComponent],
      providers: [provideZonelessChangeDetection()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WeekCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the days of the week', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const dayHeaders = compiled.querySelectorAll('.day-header');
    expect(dayHeaders.length).toBe(7);
    expect(dayHeaders[0].textContent).toContain('ראשון');
    expect(dayHeaders[6].textContent).toContain('שבת');
  });

  it('should render the time slots', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    
    fixture.detectChanges();

    
    
    const expectedSlots = 63;

    
    expect(component.hours().length).toBe(expectedSlots);

    
    
    const timeSlots = compiled.querySelectorAll('.time-slot');

    expect(timeSlots.length).toBe(expectedSlots);
    expect(timeSlots[0].textContent).toContain('08:30');
    
    expect(timeSlots[expectedSlots - 1].textContent).toContain('00:00');
  });
});
