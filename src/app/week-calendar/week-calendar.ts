import { Component, computed, ElementRef, input, signal, viewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventComponent } from './event/event';

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
  isEditing?: boolean;
}



@Component({
  selector: 'app-week-calendar',
  imports: [FormsModule, EventComponent],
  templateUrl: './week-calendar.html',
  styleUrls: ['./week-calendar.scss'],
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(window:resize)': 'onResize()',
    '(document:keydown.escape)': 'resetDragState()',
  },
})
export class WeekCalendarComponent implements AfterViewInit {

  startHour = input(8);
  startMinute = input(30);
  endHour = input(24);
  endMinute = input(0);

  days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  hours = computed(() => {
    const startTimeInMinutes = this.startHour() * 60 + this.startMinute();
    const endTimeInMinutes = this.endHour() * 60 + this.endMinute();

    const numberOfSlots = Math.floor((endTimeInMinutes - startTimeInMinutes) / this.slotDuration) + 1;

    return Array.from({ length: numberOfSlots }, (_, index) => {
      const totalMinutes = startTimeInMinutes + index * this.slotDuration;
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
  events = signal<CalendarEvent[]>([]);
  selectedCellMap = signal<Map<string, boolean>>(new Map());

  calendarContainer = viewChild.required<ElementRef<HTMLDivElement>>('calendarContainer');

  dayWidth = signal(0);
  protected headerHeight = 40;
  protected cellHeight = 50; // Adjusted for 30-minute slots
  protected timeSlotsColumnWidth = 60;
  private readonly slotDuration = 30; // Half-hour slots

  constructor() {
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
    // If there's an event being edited without a title, remove it
    this.events.update(prev => prev.filter(e => !e.isEditing || e.title.trim() !== ''));

    this.isDragging = true;
    this.selectionStartCell = { day, hour };
    this.selectionEndCell = { day, hour };
    this.updateSelectedCells();
  }


  deleteEvent(event: CalendarEvent) {
    this.events.update(prev => prev.filter(e => e !== event));
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

    const defaultColor = '#a0c4ff';
    const newEvent: CalendarEvent = {
      start: { day: startDay, hour: this.hours()[minHourIndex] },
      end: { day: startDay, hour: this.hours()[maxHourIndex] },
      title: '',
      color: defaultColor,
      isEditing: true,
      displayTime: this.getEventTimeRange({
        start: { day: startDay, hour: this.hours()[minHourIndex] },
        end: { day: startDay, hour: this.hours()[maxHourIndex] }
      } as any),
      style: {
        top: `${this.headerHeight + minHourIndex * this.cellHeight}px`,
        right: `${startDayIndex * this.dayWidth()}px`,
        width: `${this.dayWidth()}px`,
        height: `${(maxHourIndex - minHourIndex + 1) * this.cellHeight}px`,
        backgroundColor: defaultColor,
        borderColor: defaultColor,
        '--event-color': defaultColor,
      },
    };

    this.events.update(prev => [...prev, newEvent]);
  }

  protected resetDragState() {
    this.isDragging = false;
    this.selectionStartCell = null;
    this.selectionEndCell = null;
    this.selectedCellMap.set(new Map());
  }


  confirmEvent(event: CalendarEvent) {
    if (!event.title.trim()) {
      this.deleteEvent(event);
    } else {
      event.isEditing = false;
    }
  }

  getEventTimeRange(event: CalendarEvent): string {
    const start = event.start.hour;
    const endSlotStart = event.end.hour;

    // Parse end slot start time
    const [endHourStr, endMinuteStr] = endSlotStart.split(':');
    let endHour = parseInt(endHourStr, 10);
    let endMinute = parseInt(endMinuteStr, 10);

    // Add slotDuration minutes to get the actual end time
    endMinute += this.slotDuration;
    if (endMinute >= 60) {
      endHour += Math.floor(endMinute / 60);
      endMinute = endMinute % 60;
    }
    // Handle midnight wrap-around if needed
    if (endHour >= 24) endHour = endHour % 24;

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
