import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-week-calendar',
  imports: [],
  templateUrl: './week-calendar.html',
  styleUrls: ['./week-calendar.scss'],
})
export class WeekCalendarComponent {
  startHour = input(8);
  startMinute = input(30);
  endHour = input(24);
  endMinute = input(0);

  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  hours = computed(() => {
    const hours: string[] = [];
    const startHour = this.startHour();
    const startMinute = this.startMinute();
    const endHour = this.endHour();
    const endMinute = this.endMinute();

    for (let i = startHour; i <= endHour; i++) {
      for (let j = 0; j < 60; j += 15) {
        if (i === startHour && j < startMinute) {
          continue;
        }
        if (i === endHour && j > endMinute) {
          continue;
        }

        let hour = i;
        if (hour === 24) {
          hour = 0;
        }

        const formattedHour = hour < 10 ? '0' + hour : String(hour);
        const formattedMinute = j < 10 ? '0' + j : String(j);
        hours.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return hours;
  });
}
