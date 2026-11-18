import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/app.config';
import { PokemonProvider } from './application/pokemon-provider.port';
import { PokemonService } from './application/pokemon.service';
import { PokemonController } from './infrastructure/http/pokemon.controller';
import { PokeApiAdapter } from './infrastructure/pokeapi/pokeapi.adapter';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const { baseUrl, timeoutMs } = config.get('pokeApi', { infer: true });
        return { baseURL: baseUrl, timeout: timeoutMs };
      },
    }),
  ],
  controllers: [PokemonController],
  providers: [
    PokemonService,
    { provide: PokemonProvider, useClass: PokeApiAdapter },
  ],
})
export class PokemonModule {}
