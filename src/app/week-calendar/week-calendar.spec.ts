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
    // Force change detection to ensure computed signals are processed (though fixture.detectChanges() should handle it)
    fixture.detectChanges();

    // Default range is 08:30 to 24:00
    // (1440 - 510) / 15 + 1 = 62 + 1 = 63 slots
    const expectedSlots = 63;

    // Check if the signal computed the correct number of hours
    expect(component.hours().length).toBe(expectedSlots);

    // In the DOM, time slots are rendered per row.
    // Each row has one .time-slot div. The rest are .calendar-cell divs.
    const timeSlots = compiled.querySelectorAll('.time-slot');

    expect(timeSlots.length).toBe(expectedSlots);
    expect(timeSlots[0].textContent).toContain('08:30');
    // The last slot is 24:00 which is formatted as 00:00
    expect(timeSlots[expectedSlots - 1].textContent).toContain('00:00');
  });
});
