import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PokemonProvider } from './application/pokemon-provider.port';
import { PokemonService } from './application/pokemon.service';
import { PokemonController } from './infrastructure/http/pokemon.controller';
import { PokeApiAdapter } from './infrastructure/pokeapi/pokeapi.adapter';

@Module({
  imports: [HttpModule],
  controllers: [PokemonController],
  providers: [
    PokemonService,
    { provide: PokemonProvider, useClass: PokeApiAdapter },
  ],
})
export class PokemonModule {}
