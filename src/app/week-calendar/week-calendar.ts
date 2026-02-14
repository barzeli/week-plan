import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  computed,
  input,
  ElementRef,
  viewChild,
  AfterViewInit,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerComponent } from './color-picker/color-picker';

interface CalendarCell {
  day: string;
  hour: string;
}

interface CalendarEvent {
  start: { day: string; hour: string };
  end: { day: string; hour: string };
  title: string;
  style: { [key: string]: string };
  displayTime?: string;
}

type PendingEvent = Omit<CalendarEvent, 'title'>;

@Component({
  selector: 'app-week-calendar',
  imports: [FormsModule, OverlayModule, CdkOverlayOrigin, CdkConnectedOverlay, ColorPickerComponent],
  templateUrl: './week-calendar.html',
  styleUrls: ['./week-calendar.scss'],
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(window:resize)': 'onResize()',
    '(document:mousedown)': 'onDocumentMouseDown($event)',
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
    // If there's already a pending event being named, don't start a new selection.
    // This prevents creating a second pending event when the user clicks while
    // naming an existing pending event (e.g. blur caused by a click).
    if (this.pendingEvent()) return;

    this.isDragging = true;
    this.selectionStartCell = { day, hour };
    this.selectionEndCell = { day, hour };
    this.updateSelectedCells();
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
    this.pendingEvent.set({
      start: { day: startDay, hour: this.hours()[minHourIndex] },
      end: { day: startDay, hour: this.hours()[maxHourIndex] },
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
    // const isClickInsideColorPalette = target.closest('.color-palette-dropdown'); // No longer needed directly, overlay handles outside clicks
    // But wait, the overlay is distinct. If we click the overlay, it's inside the overlay container.
    // The overlay directive `(overlayOutsideClick)` handles closing.
    // We just need to ensure `confirmEventCreation` isn't called if we click the color picker button or the overlay itself.
    // Actually, `confirmEventCreation` is called when clicking *outside* the pending event AND outside the color palette.
    // If we click the color picker, it opens.

    // We can rely on `cdkOverlayOrigin` and overlay interaction.
    // Let's simplified check: if click is NOT on pending event, try to confirm.
    // But if we click on the color picker button (inside pending event), it's fine.
    // If we click on the overlay (which is separate in DOM), `confirmEventCreation` might be triggered because target is in overlay container, not pending event.
    // We need to check if target is inside `.cdk-overlay-container`.

    const isClickInsideOverlay = target.closest('.cdk-overlay-container');

    if (!isClickInsidePendingEvent && !isClickInsideOverlay) {
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
      style: {
        ...pending.style,
        backgroundColor: color,
        borderColor: color,
        '--event-color': color,
      },
    };
    this.pendingEvent.set(updated);
  }

  confirmEventCreation() {
    const title = this.newEventTitle().trim();
    const pending = this.pendingEvent();
    if (title && pending) {
      const displayTime = this.getEventTimeRange(pending);
      this.events.push({ ...pending, title, displayTime });
    }
    this.newEventTitle.set('');
    this.pendingEvent.set(null);
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
    // Handle midnight wrap-around if needed, though day logic handles days
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
