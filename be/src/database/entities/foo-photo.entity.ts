import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Foo } from "./foo.entity";

@Entity("foo_photo")
export class FooPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  // 참조 키는 정수형으로 명시
  @Column({ name: "foo_id", type: "int" })
  fooId: number;

  @Column({ name: "file_path", length: 500 })
  filePath: string;

  @ManyToOne(() => Foo, (foo) => foo.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "foo_id" })
  foo: Foo;
}
