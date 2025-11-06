import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Foo } from './foo.entity';

@Entity('foo_photo')
export class FooPhoto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'foo_id' })
    fooId: number;

    @Column({ name: 'file_path', length: 500 })
    filePath: string;

    @ManyToOne(() => Foo, (foo) => foo.photos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'foo_id' })
    foo: Foo;
}