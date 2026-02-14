import { Component, input, output } from '@angular/core';
import { CalendarEvent } from '../week-calendar';

@Component({
  selector: 'app-event',
  imports: [],
  templateUrl: './event.html',
  styleUrls: ['./event.scss'],
  host: {
    '[style]': 'event().style',
  }
})
export class EventComponent {
  event = input.required<CalendarEvent>();
  edit = output<MouseEvent>();
  delete = output<MouseEvent>();

  onEdit(e: MouseEvent) {
    e.stopPropagation();
    this.edit.emit(e);
  }

  onDelete(e: MouseEvent) {
    e.stopPropagation();
    this.delete.emit(e);
  }
}
