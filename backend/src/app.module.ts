import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadAppConfig } from './config/app.config';
import { PokemonModule } from './pokemon/pokemon.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadAppConfig] }),
    PokemonModule,
  ],
})
export class AppModule {}
