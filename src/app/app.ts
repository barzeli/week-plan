import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WeekCalendarComponent } from './week-calendar/week-calendar';

@Component({
  selector: 'app-root',
  imports: [WeekCalendarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
