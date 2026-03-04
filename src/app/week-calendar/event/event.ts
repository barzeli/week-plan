import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ElementRef,
  viewChild,
  computed,
  afterRenderEffect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent } from '../week-calendar';
import { ColorPickerComponent } from '../color-picker/color-picker';
import { EventTimeRangePipe } from '../event-time-range/event-time-range-pipe';

@Component({
  selector: 'app-event',
  imports: [FormsModule, ColorPickerComponent, EventTimeRangePipe],
  templateUrl: './event.html',
  styleUrls: ['./event.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.grid-row]': 'eventGridRow()',
    '[style.grid-column]': 'eventGridColumn()',
    '[style.--event-color]': 'event().color',
    '(document:mousedown)': 'onDocumentMouseDown($event)',
  },
})
export class EventComponent {
  private readonly eventElement = inject(ElementRef);
  readonly event = input.required<CalendarEvent>();
  readonly eventGridRow = computed(
    () => `${this.event().startHourIndex + 2} / ${this.event().endHourIndex + 3}`,
  );
  readonly eventGridColumn = computed(
    () => `${this.event().dayIndex + 2} / ${this.event().dayIndex + 3}`,
  );

  readonly delete = output<MouseEvent>();
  readonly confirm = output<void>();
  readonly edited = output<void>();

  readonly editing = input(false);
  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor() {
    afterRenderEffect(() => {
      const input = this.titleInput();
      if (this.editing() && input) {
        input.nativeElement.focus();
      }
    });
  }

  editTitle() {
    this.edited.emit();
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    this.delete.emit(event);
  }

  onTitleKeyDown(event: KeyboardEvent) {
    if (['Enter', 'Escape'].includes(event.key)) {
      this.confirm.emit();
    }
  }

  onDocumentMouseDown(event: MouseEvent) {
    const inputElement = this.titleInput();
    if (
      this.editing() &&
      inputElement &&
      !inputElement.nativeElement.contains(event.target as Node)
    ) {
      this.confirm.emit();
    }
  }

  onColorSelected(color: string) {
    this.event().color = color;
  }
}
