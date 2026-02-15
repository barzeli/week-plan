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
  readonly isEditing = input<boolean>(false);

  readonly delete = output<MouseEvent>();
  readonly confirm = output<void>();

  readonly isOpen = signal(false);
  readonly localEditing = signal(false);
  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  readonly editingNow = computed(() => this.isEditing() || this.localEditing());

  constructor() {
    effect(() => {
      if (this.editingNow()) {
        setTimeout(() => this.titleInput()?.nativeElement.focus(), 0);
      }
    });
  }

  onDblClick(e: MouseEvent) {
    e.stopPropagation();
    this.localEditing.set(true);
  }

  onDelete(e: MouseEvent) {
    e.stopPropagation();
    this.delete.emit(e);
  }

  onTitleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.localEditing.set(false);
      this.confirm.emit();
    } else if (e.key === 'Escape') {
      this.localEditing.set(false);
      this.confirm.emit();
    }
  }

  onColorSelected(color: string) {
    this.event().color = color;
    this.isOpen.set(false);
  }
}
