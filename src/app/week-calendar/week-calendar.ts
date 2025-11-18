import {
  Component,
  computed,
  input,
  ElementRef,
  viewChild,
  AfterViewInit,
  signal,
} from '@angular/core';

interface CalendarCell {
  day: string;
  hour: string;
}

@Component({
  selector: 'app-week-calendar',
  imports: [],
  templateUrl: './week-calendar.html',
  styleUrls: ['./week-calendar.scss'],
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(window:resize)': 'onResize()',
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
  events: any[] = [];

  calendarContainer = viewChild.required<ElementRef<HTMLDivElement>>('calendarContainer');

  dayWidth = signal(0);
  protected headerHeight = 40;
  protected cellHeight = 30;
  protected timeSlotsColumnWidth = 60;

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
    this.isDragging = true;
    this.selectionStartCell = { day, hour };
    this.selectionEndCell = { day, hour };
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
    }
  }

  onDocumentMouseUp() {
    if (this.isDragging) {
      if (this.selectionStartCell && this.selectionEndCell) {
        const startDay = this.selectionStartCell.day;
        const endDay = this.selectionStartCell.day;

        const newEvent = {
          start: { day: startDay, hour: this.selectionStartCell.hour },
          end: { day: endDay, hour: this.selectionEndCell.hour },
          title: 'New Event',
        };
        this.events.push(newEvent);
        console.log('New event created:', newEvent);
      }
      this.isDragging = false;
      this.selectionStartCell = null;
      this.selectionEndCell = null;
    }
  }

  isSelected(day: string, hour: string): boolean {
    if (!this.isDragging || !this.selectionStartCell || !this.selectionEndCell) {
      return false;
    }

    const dayIndex = this.days.indexOf(day);
    const hourIndex = this.hours().indexOf(hour);

    const startDayIndex = this.days.indexOf(this.selectionStartCell.day);

    const startHourIndex = this.hours().indexOf(this.selectionStartCell.hour);
    const endHourIndex = this.hours().indexOf(this.selectionEndCell.hour);

    return dayIndex === startDayIndex && hourIndex >= startHourIndex && hourIndex <= endHourIndex;
  }

  getEventStyle(event: any) {
    const startDayIndex = this.days.indexOf(event.start.day);
    const startHourIndex = this.hours().indexOf(event.start.hour);
    const endHourIndex = this.hours().indexOf(event.end.hour);

    if (startDayIndex === -1 || startHourIndex === -1 || endHourIndex === -1) {
      return {};
    }

    const top = this.headerHeight + startHourIndex * this.cellHeight;
    const right = startDayIndex * this.dayWidth();
    const width = this.dayWidth();
    const height = (endHourIndex - startHourIndex + 1) * this.cellHeight;

    return {
      top: `${top}px`,
      right: `${right}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }
}
