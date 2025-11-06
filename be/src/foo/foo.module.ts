import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FooController } from './foo.controller';
import { FooService } from './foo.service';
import { Foo } from '../database/entities/foo.entity';
import { FooPhoto } from '../database/entities/foo-photo.entity';
import { FooCrop } from '../database/entities/foo-crop.entity';
import { FarmMap } from '../database/entities/farm-map.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Foo, FooPhoto, FooCrop, FarmMap])],
  controllers: [FooController],
  providers: [FooService],
  exports: [FooService],
})
export class FooModule { }