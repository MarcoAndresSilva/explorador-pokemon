import { Pipe, PipeTransform } from '@angular/core';

// PokéAPI usa guiones en nombres compuestos: "lightning-rod" → "lightning rod".
@Pipe({ name: 'displayName' })
export class DisplayNamePipe implements PipeTransform {
  transform(value: string): string {
    return value.replaceAll('-', ' ');
  }
}
