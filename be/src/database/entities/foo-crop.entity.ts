import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Foo } from './foo.entity';

@Entity('foo_crop')
export class FooCrop {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'foo_id' })
    fooId: number;

    @Column({ name: 'crop_code', length: 20 })
    cropCode: string;

    @ManyToOne(() => Foo, (foo) => foo.crops, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'foo_id' })
    foo: Foo;
}