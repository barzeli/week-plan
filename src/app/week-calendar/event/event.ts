import { Component, input, output, signal, ElementRef, viewChild, effect } from '@angular/core';
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
  isEditing = signal(false);
  isPending = input(false); // New input to identify if it's the creation phase

  edit = output<MouseEvent>();
  delete = output<MouseEvent>();
  titleChange = output<string>();
  colorChange = output<string>();
  confirm = output<void>();

  isOpen = signal(false);
  titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor() {
    effect(() => {
      if (this.isEditing() || this.isPending()) {
        setTimeout(() => this.titleInput()?.nativeElement.focus(), 0);
      }
    });

    effect(() => {
      if (this.isPending()) {
        this.isEditing.set(true);
      }
    }, { allowSignalWrites: true });
  }

  onDblClick(e: MouseEvent) {
    e.stopPropagation();
    this.isEditing.set(true);
  }

  onEdit(e: MouseEvent) {
    e.stopPropagation();
    this.isEditing.set(true);
    this.edit.emit(e);
  }

  onDelete(e: MouseEvent) {
    e.stopPropagation();
    this.delete.emit(e);
  }

  onTitleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.isEditing.set(false);
      this.confirm.emit();
    } else if (e.key === 'Escape') {
      this.isEditing.set(false);
    }
  }

  onColorSelected(color: string) {
    this.colorChange.emit(color);
    this.isOpen.set(false);
  }
}
