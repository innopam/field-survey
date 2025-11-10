import {
  Column,
  Entity,
  Geometry,
  Index,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { Foo } from "./foo.entity";

@Entity("farm_map")
@Index(["pnu"])
@Index(["geom"], { spatial: true })
export class FarmMap {
  @PrimaryColumn({ nullable: false })
  id: string;

  @Column({
    name: "geom",
    type: "geometry",
    spatialFeatureType: "Geometry",
    srid: 5179,
    nullable: false,
  })
  geom: Geometry;

  @Column({ length: 50, nullable: true })
  uid: string;

  @Column({ name: "clsf_nm", length: 100, nullable: true })
  clsfNm: string;

  @Column({ name: "clsf_cd", length: 10, nullable: true })
  clsfCd: string;

  @Column({ name: "stdg_cd", length: 10, nullable: true })
  stdgCd: string;

  @Column({ name: "stdg_addr", length: 200, nullable: true })
  stdgAddr: string;

  @Column({ length: 19 })
  pnu: string;

  @Column({ name: "ldcg_cd", length: 10, nullable: true })
  ldcgCd: string;

  @Column({ name: "sb_pnu", length: 19, nullable: true })
  sbPnu: string;

  @Column({ name: "sb_ldcg_cd", length: 10, nullable: true })
  sbLdcgCd: string;

  @Column("decimal", { precision: 15, scale: 2, nullable: true })
  area: number;

  @Column({
    name: "cad_con_ra",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cadConRa: number;

  @Column({ name: "source_nm", length: 100, nullable: true })
  sourceNm: string;

  @Column({ name: "source_cd", length: 10, nullable: true })
  sourceCd: string;

  @Column({ name: "flight_ymd", type: "date", nullable: true })
  flightYmd: Date;

  @Column({ name: "updt_ymd", type: "date", nullable: true })
  updtYmd: Date;

  @Column({ name: "updt_tp_nm", length: 50, nullable: true })
  updtTpNm: string;

  @Column({ name: "updt_tp_cd", length: 10, nullable: true })
  updtTpCd: string;

  @Column({ name: "chg_rsn_nm", length: 100, nullable: true })
  chgRsnNm: string;

  @Column({ name: "chg_rsn_cd", length: 10, nullable: true })
  chgRsnCd: string;

  @Column({ name: "fl_armt_yn", length: 1, nullable: true })
  flArmtYn: string;

  @Column({ name: "o_uid", length: 100, nullable: true })
  oUid: string;

  @Column({ name: "o_clsf_nm", length: 100, nullable: true })
  oClsfNm: string;

  @Column({ length: 100, nullable: true })
  layer: string;

  @Column({ length: 500, nullable: true })
  path: string;

  @OneToMany(() => Foo, (foo) => foo.farmMap)
  foos: Foo[];
}
