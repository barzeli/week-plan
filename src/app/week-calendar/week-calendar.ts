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

  days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

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
}
