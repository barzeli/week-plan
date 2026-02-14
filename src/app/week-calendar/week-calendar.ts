import { Component, computed, effect, ElementRef, input, signal, viewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerComponent } from './color-picker/color-picker';
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
  isEditing?: boolean;
}

export type PendingEvent = Omit<CalendarEvent, 'title'>;


@Component({
  selector: 'app-week-calendar',
  imports: [FormsModule, EventComponent],
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
  events = signal<CalendarEvent[]>([]);
  selectedCellMap = signal<Map<string, boolean>>(new Map());

  calendarContainer = viewChild.required<ElementRef<HTMLDivElement>>('calendarContainer');

  dayWidth = signal(0);
  protected headerHeight = 40;
  protected cellHeight = 30;
  protected timeSlotsColumnWidth = 60;

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
    // We now allow dragging even if pendingEvent exists, to "move" or "resize" the time of the pending event.
    this.isDragging = true;
    this.selectionStartCell = { day, hour };
    this.selectionEndCell = { day, hour };
    this.updateSelectedCells();
  }

  onEscape() {
    if (this.isOpen) {
      this.isOpen = false;
      return;
    }
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
        end: { day: startDay, hour: this.hours()[maxHourIndex] },
        color: defaultColor,
        style: {}
      }),
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

  private resetDragState() {
    this.isDragging = false;
    this.selectionStartCell = null;
    this.selectionEndCell = null;
    this.selectedCellMap.set(new Map());
  }

  onDocumentMouseDown(event: MouseEvent) {
  }

  confirmEvent(event: CalendarEvent) {
    if (!event.title.trim()) {
      this.deleteEvent(event);
    } else {
      event.isEditing = false;
    }
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
