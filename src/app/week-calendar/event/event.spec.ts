import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventComponent } from './event';
import { CalendarEvent, WeekCalendarComponent } from '../week-calendar';
import { provideZonelessChangeDetection } from '@angular/core';

describe('EventComponent', () => {
  let component: EventComponent;
  let fixture: ComponentFixture<EventComponent>;

  const mockEvent: CalendarEvent = {
    start: { day: 'ראשון', hour: '08:00' },
    end: { day: 'ראשון', hour: '09:00' },
    title: 'Test Event',
    displayTime: '08:00 - 09:00',
    color: '#ffadad',
    style: {
      top: '0px',
      left: '0px',
      width: '100px',
      height: '50px',
      backgroundColor: '#ffadad',
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventComponent],
      providers: [provideZonelessChangeDetection()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EventComponent);
    component = fixture.componentInstance;


    fixture.componentRef.setInput('event', mockEvent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display event details', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.event-title');
    const time = compiled.querySelector('.event-time');

    expect(title?.textContent).toContain('Test Event');
    expect(time?.textContent).toContain('08:00 - 09:00');
  });

  it('should emit edit event on button click', () => {
    let emitted = false;
    component.edit.subscribe(() => emitted = true);

    const editButton = fixture.nativeElement.querySelector('.edit-button');
    expect(editButton).toBeTruthy();

    editButton.click();
    expect(emitted).toBeTrue();
  });
});
