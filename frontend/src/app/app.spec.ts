import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders the header with a link to the catalog', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const brand = (fixture.nativeElement as HTMLElement).querySelector('.brand');

    expect(brand?.textContent).toContain('Explorador de Pokémon');
    expect(brand?.getAttribute('href')).toBe('/pokemon');
  });
});
