import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { EventComponent } from './event/event';

export interface CalendarCell {
  day: string;
  hour: string;
}

export interface CalendarEvent {
  start: { day: string; hour: string };
  end: { day: string; hour: string };
  dayIndex: number;
  startHourIndex: number;
  endHourIndex: number;
  title: string;
  color: string;
}

@Component({
  selector: 'app-week-calendar',
  imports: [EventComponent],
  templateUrl: './week-calendar.html',
  styleUrls: ['./week-calendar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class WeekCalendarComponent {
  readonly startHour = input(8);
  readonly startMinute = input(30);
  readonly endHour = input(24);
  readonly endMinute = input(0);

  readonly days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  private readonly slotDuration = 30;

  readonly events = signal<CalendarEvent[]>([]);
  readonly editedEvent = signal<CalendarEvent | null>(null);
  readonly selectedCells = signal<Set<string>>(new Set());
  private readonly selectionStartCell = signal<CalendarCell | null>(null);
  private readonly selectionEndCell = signal<CalendarCell | null>(null);

  readonly hours = computed(() => {
    const startTimeInMinutes = this.startHour() * 60 + this.startMinute();
    const endTimeInMinutes = this.endHour() * 60 + this.endMinute();
    const numberOfSlots =
      Math.floor((endTimeInMinutes - startTimeInMinutes) / this.slotDuration) + 1;

    return Array.from({ length: numberOfSlots }, (_, index) => {
      const totalMinutes = startTimeInMinutes + index * this.slotDuration;
      let hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      if (hour === 24) hour = 0;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    });
  });

  onDragStart(day: string, hour: string) {
    if (this.isCellOccupied(day, hour)) return;
    this.confirmEvent();
    this.selectionStartCell.set({ day, hour });
    this.selectionEndCell.set({ day, hour });
    this.updateSelectedCells();
  }

  onDragOver(day: string, hour: string) {
    const startCell = this.selectionStartCell();
    if (startCell && startCell.day === day) {
      const hours = this.hours();
      const startIdx = hours.indexOf(startCell.hour);
      const endIdx = hours.indexOf(hour);
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);

      const isClear = hours
        .slice(minIdx, maxIdx + 1)
        .every((hour) => !this.isCellOccupied(day, hour));

      if (isClear) {
        this.selectionEndCell.set({ day, hour });
        this.updateSelectedCells();
      }
    }
  }

  onDocumentMouseUp() {
    this.preparePendingEvent();
    this.resetDragState();
  }

  deleteEvent(event: CalendarEvent) {
    this.events.update((prev) => prev.filter((e) => e !== event));
    if (this.editedEvent() === event) {
      this.editedEvent.set(null);
    }
  }

  confirmEvent(event: CalendarEvent | null = this.editedEvent()) {
    if (!event) return;
    if (!event.title.trim()) {
      this.deleteEvent(event);
    }
    this.editedEvent.set(null);
  }

  startEditing(event: CalendarEvent) {
    this.editedEvent.set(event);
  }

  onEscape() {
    this.resetDragState();
    this.confirmEvent();
  }

  protected resetDragState() {
    this.selectionStartCell.set(null);
    this.selectionEndCell.set(null);
    this.selectedCells.set(new Set<string>());
  }

  private preparePendingEvent() {
    const startCell = this.selectionStartCell();
    const endCell = this.selectionEndCell();
    if (!startCell || !endCell) return;

    const day = startCell.day;
    const dayIndex = this.days.indexOf(day);
    const hours = this.hours();
    const startHourIndex = hours.indexOf(startCell.hour);
    const endHourIndex = hours.indexOf(endCell.hour);

    if (dayIndex === -1 || startHourIndex === -1 || endHourIndex === -1) return;

    const minHourIndex = Math.min(startHourIndex, endHourIndex);
    const maxHourIndex = Math.max(startHourIndex, endHourIndex);
    const defaultColor = '#a0c4ff';

    const newEvent: CalendarEvent = {
      start: { day, hour: hours[minHourIndex] },
      end: { day, hour: hours[maxHourIndex] },
      dayIndex,
      startHourIndex: minHourIndex,
      endHourIndex: maxHourIndex,
      title: '',
      color: defaultColor,
    };

    this.events.update((prev) => [...prev, newEvent]);
    this.editedEvent.set(newEvent);
  }

  private updateSelectedCells() {
    const startCell = this.selectionStartCell();
    const endCell = this.selectionEndCell();
    const newSelectedCells = new Set<string>();

    if (startCell && endCell) {
      const hours = this.hours();
      const dayIndex = this.days.indexOf(startCell.day);
      const startHourIndex = hours.indexOf(startCell.hour);
      const endHourIndex = hours.indexOf(endCell.hour);

      if (dayIndex !== -1 && startHourIndex !== -1 && endHourIndex !== -1) {
        const minHourIdx = Math.min(startHourIndex, endHourIndex);
        const maxHourIdx = Math.max(startHourIndex, endHourIndex);
        hours.slice(minHourIdx, maxHourIdx + 1).forEach((hour) => {
          newSelectedCells.add(`${startCell.day}-${hour}`);
        });
      }
    }
    this.selectedCells.set(newSelectedCells);
  }

  private isCellOccupied(day: string, hour: string): boolean {
    const hours = this.hours();
    const hourIndex = hours.indexOf(hour);
    if (hourIndex === -1) return false;

    return this.events().some((event) => {
      if (event.start.day !== day) return false;
      const startIdx = hours.indexOf(event.start.hour);
      const endIdx = hours.indexOf(event.end.hour);
      return hourIndex >= startIdx && hourIndex <= endIdx;
    });
  }
}
