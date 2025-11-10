import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Foo } from "./foo.entity";

@Entity("foo_crop")
export class FooCrop {
  @PrimaryGeneratedColumn()
  id: number;

  // 참조 키는 정수형으로 명시
  @Column({ name: "foo_id", type: "int" })
  fooId: number;

  @Column({ name: "crop_code", length: 20 })
  cropCode: string;

  @ManyToOne(() => Foo, (foo) => foo.crops, { onDelete: "CASCADE" })
  @JoinColumn({ name: "foo_id" })
  foo: Foo;
}
