import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
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

  readonly deleted = output<void>();
  readonly confirm = output<string>();
  readonly editing = model(false);

  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor() {
    afterRenderEffect(() => {
      const input = this.titleInput();
      if (input) {
        input.nativeElement.focus();
      }
    });
  }

  editTitle() {
    this.editing.set(true);
  }

  onDelete() {
    this.deleted.emit();
  }

  onTitleKeyDown(event: KeyboardEvent) {
    if (['Enter', 'Escape'].includes(event.key)) {
      this.confirm.emit(this.titleInput()?.nativeElement.value ?? '');
      this.editing.set(false);
    }
  }

  onDocumentMouseDown(event: MouseEvent) {
    const inputElement = this.titleInput();
    if (inputElement && !this.eventElement.nativeElement.contains(event.target as Node)) {
      this.confirm.emit(inputElement.nativeElement.value);
      this.editing.set(false);
    }
  }

  onColorSelected(color: string) {
    this.event().color = color;
  }
}
