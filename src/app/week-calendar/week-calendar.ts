import { Component, computed, input, ElementRef, viewChild } from '@angular/core';

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
  },
})
export class WeekCalendarComponent {
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

  constructor() {}

  onDragStart(day: string, hour: string) {
    this.isDragging = true;
    this.selectionStartCell = { day, hour };
    this.selectionEndCell = { day, hour };
  }

  onDocumentMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const calendarContainerElement = this.calendarContainer().nativeElement;
    const containerRect = calendarContainerElement.getBoundingClientRect();
    const scrollAmount = 10;

    if (event.clientY < containerRect.top + 30) {
      calendarContainerElement.scrollTop -= scrollAmount;
    } else if (event.clientY > containerRect.bottom - 30) {
      calendarContainerElement.scrollTop += scrollAmount;
    }

    if (event.clientX < containerRect.left + 30) {
      calendarContainerElement.scrollLeft -= scrollAmount;
    } else if (event.clientX > containerRect.right - 30) {
      calendarContainerElement.scrollLeft += scrollAmount;
    }
  }

  onDragOver(day: string, hour: string) {
    if (this.isDragging) {
      this.selectionEndCell = { day, hour };
    }
  }

  onDocumentMouseUp() {
    if (this.isDragging) {
      if (this.selectionStartCell && this.selectionEndCell) {
        const newEvent = {
          start: this.selectionStartCell,
          end: this.selectionEndCell,
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

    const endDayIndex = this.days.indexOf(this.selectionEndCell.day);
    const endHourIndex = this.hours().indexOf(this.selectionEndCell.hour);

    const minDay = Math.min(startDayIndex, endDayIndex);
    const maxDay = Math.max(startDayIndex, endDayIndex);
    const minHour = Math.min(startHourIndex, endHourIndex);
    const maxHour = Math.max(startHourIndex, endHourIndex);

    return dayIndex >= minDay && dayIndex <= maxDay && hourIndex >= minHour && hourIndex <= maxHour;
  }
}
