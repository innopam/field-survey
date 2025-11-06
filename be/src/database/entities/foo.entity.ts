import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FooPhoto } from './foo-photo.entity';
import { FooCrop } from './foo-crop.entity';
import { FarmMap } from './farm-map.entity';

@Entity('foo')
@Index(['pnu', 'year'])
@Index(['farmMapId'])
export class Foo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'farm_map_id' })
    farmMapId: number;

    @Column({ length: 19 })
    pnu: string;

    @Column()
    year: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    @ManyToOne(() => FarmMap, (farmMap) => farmMap.foos)
    @JoinColumn({ name: 'farm_map_id' })
    farmMap: FarmMap;

    @OneToMany(() => FooPhoto, (photo) => photo.foo, { cascade: true })
    photos: FooPhoto[];

    @OneToMany(() => FooCrop, (crop) => crop.foo, { cascade: true })
    crops: FooCrop[];
}