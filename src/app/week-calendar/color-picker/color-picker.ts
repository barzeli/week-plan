import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-color-picker',
    imports: [],
    templateUrl: './color-picker.html',
    styleUrls: ['./color-picker.scss'],
})
export class ColorPickerComponent {
    selectedColor = input<string | null>(null);
    colorSelected = output<string>();

    colorPalette = [
        '#ffadad', // Red
        '#ffd6a5', // Orange
        '#fdffb6', // Yellow
        '#caffbf', // Green
        '#9bf6ff', // Cyan
        '#a0c4ff', // Blue
        '#bdb2ff', // Purple
        '#ffc6ff', // Pink
        '#fffffc', // Whiteish
    ];

    selectColor(color: string) {
        this.colorSelected.emit(color);
    }
}
