import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  imports: [],
  templateUrl: './color-picker.html',
  styleUrls: ['./color-picker.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  readonly selectedColor = input<string | null>(null);
  readonly colorSelected = output<string>();

  readonly isColorPickerOpen = signal(false);

  readonly colorPalette = [
    '#ffadad',
    '#ffd6a5',
    '#fdffb6',
    '#caffbf',
    '#9bf6ff',
    '#a0c4ff',
    '#bdb2ff',
    '#ffc6ff',
    '#fffffc',
  ];

  selectColor(color: string) {
    this.isColorPickerOpen.set(false);
    this.colorSelected.emit(color);
  }
}
