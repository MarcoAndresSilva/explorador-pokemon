import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';
import { PokemonPage, PokemonService } from '../../application/pokemon.service';
import { Pokemon } from '../../domain/pokemon';
import { PokemonExceptionFilter } from './pokemon-exception.filter';
import { ListPokemonQueryDto, PokemonNameParamDto } from './pokemon.dto';

@Controller('pokemon')
@UseFilters(PokemonExceptionFilter)
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  list(@Query() query: ListPokemonQueryDto): Promise<PokemonPage> {
    return this.pokemonService.list(query);
  }

  @Get(':name')
  getByName(@Param() params: PokemonNameParamDto): Promise<Pokemon> {
    return this.pokemonService.getByName(params.name);
  }
}
