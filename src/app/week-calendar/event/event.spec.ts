import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventComponent } from './event';
import { CalendarEvent } from '../week-calendar';
import { provideZonelessChangeDetection } from '@angular/core';

describe('EventComponent', () => {
  let component: EventComponent;
  let fixture: ComponentFixture<EventComponent>;

  const mockEvent: CalendarEvent = {
    start: { day: 'ראשון', hour: '08:00' },
    end: { day: 'ראשון', hour: '09:00' },
    title: 'Test Event',
    color: '#ffadad',
    style: {
      top: '0px',
      right: '0px',
      width: '100px',
      height: '50px',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

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

  it('should emit delete event on delete button click', () => {
    let emitted = false;
    component.delete.subscribe(() => (emitted = true));

    const deleteButton = fixture.nativeElement.querySelector('.delete-btn');
    expect(deleteButton).toBeTruthy();

    deleteButton.click();
    expect(emitted).toBeTrue();
  });

  it('should enter edit mode on double click', async () => {
    fixture.nativeElement.dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();

    expect(component.localEditing()).toBeTrue();
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });
});
