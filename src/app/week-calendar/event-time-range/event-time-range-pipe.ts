import { Pipe, PipeTransform } from '@angular/core';
import { CalendarEvent } from '../week-calendar';

@Pipe({
  name: 'eventTimeRange',
})
export class EventTimeRangePipe implements PipeTransform {
  transform(event: CalendarEvent, slotDuration: number): unknown {
    const [endHourStr, endMinuteStr] = event.end.hour.split(':');
    let endHour = parseInt(endHourStr, 10);
    let endMinute = parseInt(endMinuteStr, 10) + slotDuration;

    if (endMinute >= 60) {
      endHour += Math.floor(endMinute / 60);
      endMinute = endMinute % 60;
    }
    if (endHour >= 24) endHour %= 24;

    return `${event.start.hour} - ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  }
}
