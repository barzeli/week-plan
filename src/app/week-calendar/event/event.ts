import { Component, input, output, signal, ElementRef, viewChild, effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent } from '../week-calendar';
import { ColorPickerComponent } from '../color-picker/color-picker';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [FormsModule, ColorPickerComponent],
  templateUrl: './event.html',
  styleUrls: ['./event.scss'],
  host: {
    '[style]': 'event().style',
    '(dblclick)': 'onDblClick($event)',
  }
})
export class EventComponent {
  event = input.required<CalendarEvent>();
  isEditing = input<boolean>(false);

  edit = output<MouseEvent>();
  delete = output<MouseEvent>();
  confirm = output<void>();

  isOpen = signal(false);
  localEditing = signal(false);
  titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  editingNow = computed(() => this.isEditing() || this.localEditing());

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

  onEdit(e: MouseEvent) {
    e.stopPropagation();
    this.localEditing.set(true);
    this.edit.emit(e);
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
    const ev = this.event();
    ev.color = color;
    ev.style = {
      ...ev.style,
      backgroundColor: color,
      borderColor: color,
      '--event-color': color,
    };
    this.isOpen.set(false);
  }
}
