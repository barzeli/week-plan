import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorPickerComponent } from './color-picker';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ColorPickerComponent', () => {
    let component: ColorPickerComponent;
    let fixture: ComponentFixture<ColorPickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ColorPickerComponent],
            providers: [provideZonelessChangeDetection()]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ColorPickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render color buttons', () => {
        const buttons = fixture.nativeElement.querySelectorAll('button');
        expect(buttons.length).toBe(component.colorPalette.length);
    });

    it('should mark selected color as active', () => {
        const testColor = component.colorPalette[0];
        // Set input signal
        fixture.componentRef.setInput('selectedColor', testColor);
        fixture.detectChanges();

        const activeButton = fixture.nativeElement.querySelector('.palette-color.active');
        expect(activeButton).toBeTruthy();
        // Verify style.background matches (might need rgb conversion check or strict equality if style allows)
        // Actually, background style might be computed.
        // Let's check if the button for that color has .active.
        // We can assume the first button corresponds to the first color.
        const firstButton = fixture.nativeElement.querySelectorAll('button')[0];
        expect(firstButton.classList).toContain('active');
    });

    it('should emit color when clicked', () => {
        let emittedColor: string | undefined;
        component.colorSelected.subscribe((color) => {
            emittedColor = color;
        });

        const testColor = component.colorPalette[1];
        const button = fixture.nativeElement.querySelectorAll('button')[1];
        button.click();

        expect(emittedColor).toBe(testColor);
    });
});
