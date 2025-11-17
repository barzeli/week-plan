import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-week-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './week-calendar.html',
  styleUrls: ['./week-calendar.scss'],
})
export class WeekCalendarComponent implements OnChanges {
  @Input() startHour = 8;
  @Input() startMinute = 30;
  @Input() endHour = 24;
  @Input() endMinute = 0;

  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  hours: string[] = [];

  constructor() {
    this.generateTimeSlots();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['startHour'] ||
      changes['startMinute'] ||
      changes['endHour'] ||
      changes['endMinute']
    ) {
      this.generateTimeSlots();
    }
  }

  generateTimeSlots() {
    this.hours = [];
    for (let i = this.startHour; i <= this.endHour; i++) {
      for (let j = 0; j < 60; j += 15) {
        if (i === this.startHour && j < this.startMinute) {
          continue;
        }
        if (i === this.endHour && j > this.endMinute) {
          continue;
        }

        let hour = i;
        if (hour === 24) {
          hour = 0;
        }

        const formattedHour = hour < 10 ? '0' + hour : String(hour);
        const formattedMinute = j < 10 ? '0' + j : String(j);
        this.hours.push(`${formattedHour}:${formattedMinute}`);
      }
    }
  }
}
