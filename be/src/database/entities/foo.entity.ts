import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { FarmMap } from "./farm-map.entity";
import { FooCrop } from "./foo-crop.entity";
import { FooPhoto } from "./foo-photo.entity";

@Entity("foo")
@Index(["pnu", "year"])
@Index(["farmMapId"])
export class Foo {
  @PrimaryGeneratedColumn()
  id: number;

  // DB 컬럼은 정수형으로 사용되므로 명시적으로 타입을 지정합니다.
  @Column({ name: "farm_map_id", type: "int" })
  farmMapId: string;

  @Column({ length: 19 })
  pnu: string;

  @Column()
  year: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  @ManyToOne(() => FarmMap, (farmMap) => farmMap.foos)
  @JoinColumn({ name: "farm_map_id" })
  farmMap: FarmMap;

  @OneToMany(() => FooPhoto, (photo) => photo.foo, { cascade: true })
  photos: FooPhoto[];

  @OneToMany(() => FooCrop, (crop) => crop.foo, { cascade: true })
  crops: FooCrop[];
}
