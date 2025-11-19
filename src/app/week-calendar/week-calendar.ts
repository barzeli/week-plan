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

interface CalendarCell {
  day: string;
  hour: string;
}

interface CalendarEvent {
  start: { day: string; hour: string };
  end: { day: string; hour: string };
  title: string;
  style: { [key: string]: string };
}

type PendingEvent = Omit<CalendarEvent, 'title'>;

@Component({
  selector: 'app-week-calendar',
  imports: [FormsModule],
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

  colorPalette = ['#add8e6', '#ffcccc', '#ccffcc', '#ffffcc', '#e6ccff', '#ffccff', '#ccffff'];

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
  newEventColor = signal('#add8e6');
  colorPaletteOpen = signal(false);
  colorPickerButtonPosition = signal<{ top: string; left: string } | null>(null);
  private _ignoreBlur = false;

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

    this.pendingEvent.set({
      start: { day: startDay, hour: this.hours()[minHourIndex] },
      end: { day: startDay, hour: this.hours()[maxHourIndex] },
      style: {
        top: `${this.headerHeight + minHourIndex * this.cellHeight}px`,
        right: `${startDayIndex * this.dayWidth()}px`,
        width: `${this.dayWidth()}px`,
        height: `${(maxHourIndex - minHourIndex + 1) * this.cellHeight}px`,
        backgroundColor: this.newEventColor(),
        borderColor: this.newEventColor(),
      },
    });
  }

  private resetDragState() {
    this.isDragging = false;
    this.selectionStartCell = null;
    this.selectionEndCell = null;
    this.selectedCellMap.set(new Map());
  }

  onEventInputBlur() {
    if (this._ignoreBlur) {
      // a control inside the pending event was just interacted with (mousedown),
      // ignore this blur — the control will handle the interaction.
      // Reset flag on next tick.
      setTimeout(() => (this._ignoreBlur = false), 0);
      return;
    }

    // If color palette is open, don't confirm the event
    if (this.colorPaletteOpen()) {
      return;
    }

    const active = document.activeElement as HTMLElement | null;
    const inputEl = this.eventInput && this.eventInput() && this.eventInput()!.nativeElement;

    // If focus moved to an element inside the pending event (for example the
    // color picker) we should not confirm the event. Check whether the active
    // element is contained in the pending `.event.pending` container.
    const movedInsidePending = !!(active && active.closest && active.closest('.event.pending'));

    if (!inputEl || active !== inputEl) {
      if (movedInsidePending) {
        // focus moved to a control inside the pending event (color picker etc.)
        return;
      }

      // input not focused and focus didn't move inside pending — confirm
      this.confirmEventCreation();
    }
  }

  onColorChange() {
    const pending = this.pendingEvent();
    if (!pending) return;
    const color = this.newEventColor();
    const updated = {
      ...pending,
      style: { ...pending.style, backgroundColor: color, borderColor: color },
    };
    this.pendingEvent.set(updated);
  }

  setEventColor(color: string) {
    this.newEventColor.set(color);
    const pending = this.pendingEvent();
    if (!pending) return;
    const updated = {
      ...pending,
      style: { ...pending.style, backgroundColor: color, borderColor: color },
    };
    this.pendingEvent.set(updated);
  }

  toggleColorPalette() {
    if (!this.colorPaletteOpen()) {
      // Find the color picker button to position the palette next to it
      const button = document.querySelector('.color-picker-button') as HTMLElement;
      if (button) {
        const rect = button.getBoundingClientRect();
        this.colorPickerButtonPosition.set({
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
        });
      }
    }
    this.colorPaletteOpen.set(!this.colorPaletteOpen());
  }

  confirmEventCreation() {
    const title = this.newEventTitle().trim();
    const pending = this.pendingEvent();
    if (title && pending) {
      this.events.push({ ...pending, title });
    }
    this.newEventTitle.set('');
    this.pendingEvent.set(null);
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
