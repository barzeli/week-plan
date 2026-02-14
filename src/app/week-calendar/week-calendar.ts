import { Component, computed, effect, ElementRef, input, signal, viewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerComponent } from './color-picker/color-picker';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { EventComponent } from './event/event'; // Correct import will be added later

export interface CalendarCell {
  day: string;
  hour: string;
}

export interface CalendarEvent {
  start: { day: string; hour: string };
  end: { day: string; hour: string };
  title: string;
  style: { [key: string]: string };
  displayTime?: string;
  color: string;
}

export type PendingEvent = Omit<CalendarEvent, 'title'>;


@Component({
  selector: 'app-week-calendar',
  imports: [FormsModule, OverlayModule, CdkOverlayOrigin, CdkConnectedOverlay, ColorPickerComponent, EventComponent],
  templateUrl: './week-calendar.html',
  styleUrls: ['./week-calendar.scss'],
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(window:resize)': 'onResize()',
    '(document:mousedown)': 'onDocumentMouseDown($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class WeekCalendarComponent implements AfterViewInit {
  isOpen = false;

  startHour = input(8);
  startMinute = input(30);
  endHour = input(24);
  endMinute = input(0);

  days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  hours = computed(() => {
    const startTimeInMinutes = this.startHour() * 60 + this.startMinute();
    const endTimeInMinutes = this.endHour() * 60 + this.endMinute();

    const numberOfSlots = Math.floor((endTimeInMinutes - startTimeInMinutes) / 15) + 1;

    return Array.from({ length: numberOfSlots }, (_, index) => {
      const totalMinutes = startTimeInMinutes + index * 15;
      let hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;

      if (hour === 24) {
        hour = 0;
      }

      const formattedHour = String(hour).padStart(2, '0');
      const formattedMinute = String(minute).padStart(2, '0');

      return `${formattedHour}:${formattedMinute}`;
    });
  });

  isDragging = false;
  selectionStartCell: CalendarCell | null = null;
  selectionEndCell: CalendarCell | null = null;
  events: CalendarEvent[] = [];
  selectedCellMap = signal<Map<string, boolean>>(new Map());
  pendingEvent = signal<PendingEvent | null>(null);
  newEventTitle = signal('');
  newEventColor = signal('#a0c4ff');

  editingEvent = signal<CalendarEvent | null>(null);

  calendarContainer = viewChild.required<ElementRef<HTMLDivElement>>('calendarContainer');
  eventInput = viewChild<ElementRef<HTMLInputElement>>('eventInput');

  dayWidth = signal(0);
  protected headerHeight = 40;
  protected cellHeight = 30;
  protected timeSlotsColumnWidth = 60;

  constructor() {
    effect(() => {
      if (this.eventInput()) {
        this.eventInput()!.nativeElement.focus();
      }
    });
  }

  ngAfterViewInit() {
    this.calculateDimensions();
  }

  onResize() {
    this.calculateDimensions();
  }

  calculateDimensions() {
    const container = this.calendarContainer().nativeElement;
    if (container) {
      this.dayWidth.set((container.offsetWidth - this.timeSlotsColumnWidth) / 7);
    }
  }

  onDragStart(day: string, hour: string) {
    // We now allow dragging even if pendingEvent exists, to "move" or "resize" the time of the pending event.
    this.isDragging = true;
    this.selectionStartCell = { day, hour };
    this.selectionEndCell = { day, hour };
    this.updateSelectedCells();
  }

  editEvent(event: CalendarEvent, mouseEvent: Event) {
    mouseEvent.stopPropagation();

    // If we are already editing another event, confirm it first?
    if (this.pendingEvent()) {
      this.confirmEventCreation();
    }

    // Capture the event being edited (don't remove it yet)
    this.editingEvent.set(event);

    // Set state
    this.newEventTitle.set(event.title);
    this.newEventColor.set(event.color);

    // Set pending event from the existing event data
    const { title, ...rest } = event;
    this.pendingEvent.set(rest);
  }

  onEscape() {
    if (this.isOpen) {
      this.isOpen = false;
      return;
    }
    if (this.pendingEvent()) {
      this.cancelEdit();
    }
  }

  cancelEdit() {
    this.pendingEvent.set(null);
    this.editingEvent.set(null);
    this.newEventTitle.set('');
    this.newEventColor.set('#a0c4ff');
  }

  deleteEvent(event: CalendarEvent) {
    this.events = this.events.filter(e => e !== event);
    if (this.editingEvent() === event) {
      this.cancelEdit();
    }
  }

  onDocumentMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const calendarContainerElement = this.calendarContainer().nativeElement;
    const containerRect = calendarContainerElement.getBoundingClientRect();

    const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
    if (hoveredElement && hoveredElement.classList.contains('calendar-cell')) {
      const day = hoveredElement.getAttribute('data-day');
      const hour = hoveredElement.getAttribute('data-hour');
      if (day && hour) {
        this.onDragOver(day, hour);
      }
    }

    const scrollAmount = 10;

    if (event.clientY < containerRect.top + 30) {
      calendarContainerElement.scrollTop -= scrollAmount;
    } else if (event.clientY > containerRect.bottom - 30) {
      calendarContainerElement.scrollTop += scrollAmount;
    }
  }

  onDragOver(day: string, hour: string) {
    if (this.isDragging && this.selectionStartCell && this.selectionStartCell.day === day) {
      this.selectionEndCell = { day, hour };
      this.updateSelectedCells();
    }
  }

  onDocumentMouseUp() {
    if (this.isDragging) {
      this.preparePendingEvent();
      this.resetDragState();
    }
  }

  private preparePendingEvent() {
    if (!this.selectionStartCell || !this.selectionEndCell) return;

    const startDay = this.selectionStartCell.day;
    const startDayIndex = this.days.indexOf(startDay);
    const startHourIndex = this.hours().indexOf(this.selectionStartCell.hour);
    const endHourIndex = this.hours().indexOf(this.selectionEndCell.hour);

    if (startDayIndex === -1 || startHourIndex === -1 || endHourIndex === -1) return;

    const minHourIndex = Math.min(startHourIndex, endHourIndex);
    const maxHourIndex = Math.max(startHourIndex, endHourIndex);

    const color = this.newEventColor();
    // We preserve existing properties (like if there were any others) but here we reconstruct.
    // Importantly, newEventTitle is separate so it's preserved.
    this.pendingEvent.set({
      start: { day: startDay, hour: this.hours()[minHourIndex] },
      end: { day: startDay, hour: this.hours()[maxHourIndex] },
      color: color,
      style: {
        top: `${this.headerHeight + minHourIndex * this.cellHeight}px`,
        right: `${startDayIndex * this.dayWidth()}px`,
        width: `${this.dayWidth()}px`,
        height: `${(maxHourIndex - minHourIndex + 1) * this.cellHeight}px`,
        backgroundColor: color,
        borderColor: color,
        '--event-color': color,
      },
    });
  }

  private resetDragState() {
    this.isDragging = false;
    this.selectionStartCell = null;
    this.selectionEndCell = null;
    this.selectedCellMap.set(new Map());
  }

  onDocumentMouseDown(event: MouseEvent) {
    if (!this.pendingEvent()) return;

    const target = event.target as HTMLElement;
    const isClickInsidePendingEvent = target.closest('.event.pending');
    const isClickInsideOverlay = target.closest('.cdk-overlay-container');
    const isClickCalendarCell = target.closest('.calendar-cell');

    // If we click a calendar cell, we are likely starting a drag to update time,
    // so DO NOT confirm/close the pending event.
    if (!isClickInsidePendingEvent && !isClickInsideOverlay && !isClickCalendarCell) {
      this.confirmEventCreation();
    }
  }

  onColorChange() {
    // This might not be needed if setEventColor does the job directly
    const pending = this.pendingEvent();
    if (!pending) return;
    const color = this.newEventColor();
    const updated = {
      ...pending,
      color: color,
      style: {
        ...pending.style,
        backgroundColor: color,
        borderColor: color,
        '--event-color': color,
      },
    };
    this.pendingEvent.set(updated);
    this.isOpen = false; // Close picker on selection
  }

  setEventColor(color: string) {
    this.newEventColor.set(color);
    const pending = this.pendingEvent();
    if (!pending) return;
    const updated = {
      ...pending,
      color: color,
      style: {
        ...pending.style,
        backgroundColor: color,
        borderColor: color,
        '--event-color': color,
      },
    };
    this.pendingEvent.set(updated);
    this.isOpen = false; // Close picker on selection
  }

  confirmEventCreation() {
    const title = this.newEventTitle().trim();
    const pending = this.pendingEvent();
    if (title && pending) {
      const displayTime = this.getEventTimeRange(pending);
      const color = this.newEventColor();
      const newEvent = { ...pending, title, displayTime, color };

      const editing = this.editingEvent();
      if (editing) {
        // Replace existing
        this.events = this.events.map(e => e === editing ? newEvent : e);
      } else {
        // Create new
        this.events = [...this.events, newEvent];
      }
    }
    this.cancelEdit(); // Clears state
  }

  getEventTimeRange(event: CalendarEvent | PendingEvent): string {
    const start = event.start.hour;
    const endSlotStart = event.end.hour;

    // Parse end slot start time
    const [endHourStr, endMinuteStr] = endSlotStart.split(':');
    let endHour = parseInt(endHourStr, 10);
    let endMinute = parseInt(endMinuteStr, 10);

    // Add 15 minutes to get the actual end time
    endMinute += 15;
    if (endMinute >= 60) {
      endMinute -= 60;
      endHour += 1;
    }
    // Handle midnight wrap-around if needed
    if (endHour >= 24) endHour = 0;

    const formattedEnd = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    return `${start} - ${formattedEnd}`;
  }

  private updateSelectedCells() {
    const newSelectedCellMap = new Map<string, boolean>();
    if (this.selectionStartCell && this.selectionEndCell) {
      const startDayIndex = this.days.indexOf(this.selectionStartCell.day);
      const startHourIndex = this.hours().indexOf(this.selectionStartCell.hour);
      const endHourIndex = this.hours().indexOf(this.selectionEndCell.hour);

      if (startDayIndex !== -1 && startHourIndex !== -1 && endHourIndex !== -1) {
        const minHourIndex = Math.min(startHourIndex, endHourIndex);
        const maxHourIndex = Math.max(startHourIndex, endHourIndex);

        for (let i = minHourIndex; i <= maxHourIndex; i++) {
          const hour = this.hours()[i];
          newSelectedCellMap.set(`${this.selectionStartCell.day}-${hour}`, true);
        }
      }
    }
    this.selectedCellMap.set(newSelectedCellMap);
  }
}
