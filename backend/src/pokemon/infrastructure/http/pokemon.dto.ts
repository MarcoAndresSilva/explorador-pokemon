import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListPokemonQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;

  // Los query params llegan como texto: @Type los convierte a número antes de validar.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class PokemonNameParamDto {
  @Matches(/^[a-z0-9-]+$/i, {
    message: 'Los nombres de PokéAPI solo usan letras, números y guiones',
  })
  name!: string;
}
