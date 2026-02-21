import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  ElementRef,
  viewChild,
  effect,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent } from '../week-calendar';
import { ColorPickerComponent } from '../color-picker/color-picker';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [FormsModule, ColorPickerComponent],
  templateUrl: './event.html',
  styleUrls: ['./event.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'event().style',
    '[style.--event-color]': 'event().color',
    '(dblclick)': 'onDblClick($event)',
  },
})
export class EventComponent {
  readonly event = input.required<CalendarEvent>();

  readonly delete = output<MouseEvent>();
  readonly confirm = output<void>();

  readonly isColorPickerOpen = signal(false);
  readonly localEditing = signal(false);
  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  readonly editingNow = computed(() => this.event().isEditing || this.localEditing());

  constructor() {
    effect(() => {
      const input = this.titleInput();
      if (this.editingNow() && input) {
        input.nativeElement.focus();
      }
    });
  }

  onDblClick(event: MouseEvent) {
    event.stopPropagation();
    this.localEditing.set(true);
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    this.delete.emit(event);
  }

  onTitleKeyDown(event: KeyboardEvent) {
    if (['Enter', 'Escape'].includes(event.key)) {
      this.localEditing.set(false);
      this.confirm.emit();
    }
  }

  onBlur() {
    if (this.editingNow()) {
      this.localEditing.set(false);
      this.confirm.emit();
    }
  }

  onColorSelected(color: string) {
    this.event().color = color;
    this.isColorPickerOpen.set(false);
  }
}
